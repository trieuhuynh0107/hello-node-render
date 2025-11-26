// src/controllers/adminBookingController.js

// 🔥 FIX: Thêm User vào dòng này
const { Booking, Cleaner, Service, User } = require('../models'); 
const { Op } = require('sequelize');

// ==========================================
// HELPER: KIỂM TRA TRÙNG LỊCH (CORE LOGIC)
// ==========================================
const checkCleanerAvailability = async (cleanerId, newStartTime, newEndTime) => {
    const BUFFER_MINUTES = 30; // Thời gian di chuyển/nghỉ ngơi
    const bufferMs = BUFFER_MINUTES * 60 * 1000;

    const newStart = new Date(newStartTime);
    const newEnd = new Date(newEndTime);

    const conflictBooking = await Booking.findOne({
        where: {
            cleaner_id: cleanerId,
            status: { [Op.in]: ['CONFIRMED', 'PENDING'] }, 
            [Op.and]: [
                {
                    start_time: { [Op.lt]: new Date(newEnd.getTime() + bufferMs) },
                    end_time: { [Op.gt]: new Date(newStart.getTime() - bufferMs) }
                }
            ]
        }
    });

    return !conflictBooking;
};

// ==========================================
// 1. API: GỢI Ý NHÂN VIÊN RẢNH
// ==========================================
const getAvailableCleanersForBooking = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findByPk(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });

        const allCleaners = await Cleaner.findAll({ 
            where: { status: 'ACTIVE' },
            attributes: ['id', 'name', 'phone', 'status'] 
        });

        const availableCleaners = [];

        for (const cleaner of allCleaners) {
            const isFree = await checkCleanerAvailability(cleaner.id, booking.start_time, booking.end_time);
            if (isFree) {
                availableCleaners.push(cleaner);
            }
        }

        res.json({
            success: true,
            data: {
                booking_time: { start: booking.start_time, end: booking.end_time },
                available_cleaners: availableCleaners
            }
        });

    } catch (error) { next(error); }
};

// ==========================================
// 2. API: GÁN NHÂN VIÊN (ASSIGN)
// ==========================================
const assignCleanerToBooking = async (req, res, next) => {
    try {
        const { booking_id, cleaner_id } = req.body;

        const booking = await Booking.findByPk(booking_id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: 'Không thể gán nhân viên cho đơn đã hủy hoặc hoàn thành.' });
        }

        const cleaner = await Cleaner.findByPk(cleaner_id);
        if (!cleaner) return res.status(404).json({ success: false, message: 'Cleaner not found' });
        if (cleaner.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'Nhân viên này đang nghỉ hoặc không hoạt động.' });

        const isAvailable = await checkCleanerAvailability(cleaner_id, booking.start_time, booking.end_time);
        if (!isAvailable) {
            return res.status(409).json({ 
                success: false, 
                message: 'Nhân viên này vừa nhận một lịch khác bị trùng giờ. Vui lòng chọn người khác.' 
            });
        }

        booking.cleaner_id = cleaner_id;
        booking.status = 'CONFIRMED'; 
        await booking.save();

        res.json({
            success: true,
            message: `Đã gán nhân viên ${cleaner.name} thành công!`,
            data: booking
        });

    } catch (error) { next(error); }
};

// ==========================================
// 3. API: LẤY DANH SÁCH BOOKING (CHO ADMIN)
// ==========================================
const getAllBookingsAdmin = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, date, search } = req.query;

        const whereCondition = {};

        if (status) {
            whereCondition.status = status.toUpperCase();
        }

        if (date) {
            const startOfDay = new Date(`${date}T00:00:00+07:00`);
            const endOfDay = new Date(`${date}T23:59:59+07:00`);
            
            whereCondition.start_time = {
                [Op.between]: [startOfDay, endOfDay]
            };
        }

        if (search) {
             whereCondition[Op.or] = [
                { id: isNaN(search) ? null : search }, 
                { note: { [Op.iLike]: `%${search}%` } }, 
                { location: { [Op.iLike]: `%${search}%` } } 
             ];
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await Booking.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']], 
            include: [
                { 
                    model: User, // ✅ Đã có import User ở trên, dòng này sẽ chạy ngon lành
                    as: 'customer', 
                    attributes: ['id', 'full_name', 'phone', 'email'] 
                },
                { 
                    model: Service, 
                    as: 'service', 
                    attributes: ['id', 'name'] 
                },
                { 
                    model: Cleaner, 
                    as: 'cleaner', 
                    attributes: ['id', 'name', 'phone'] 
                }
            ],
            distinct: true 
        });

        res.json({
            success: true,
            data: {
                bookings: rows,
                pagination: {
                    totalItems: count,
                    totalPages: Math.ceil(count / limit),
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

const updateBookingStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'IN_PROGRESS', 'COMPLETED'
        const userId = req.user.id || req.user.userId;
        const userRole = req.user.role; // 'ADMIN', 'CUSTOMER' (Sau này có thêm 'CLEANER')

        // 1. Validate Input
        if (!['IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
        }

        // 2. Tìm Booking
        const booking = await Booking.findByPk(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });
        }

        // 3. Phân quyền (Security Check)
        // - Customer: KHÔNG được phép tự cập nhật trạng thái này.
        // - Admin: Được phép hết.
        // - Cleaner (Tương lai): Chỉ được update đơn của chính mình.
        if (userRole === 'CUSTOMER') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
        }

        // 4. KIỂM TRA QUY TRÌNH (STATE MACHINE VALIDATION)
        // Đây là logic quan trọng để chặn nhảy cóc.
        
        // Muốn lên IN_PROGRESS -> Thì trạng thái hiện tại phải là CONFIRMED
        if (status === 'IN_PROGRESS' && booking.status !== 'CONFIRMED') {
            return res.status(400).json({ 
                success: false, 
                message: 'Chỉ có thể bắt đầu công việc khi đơn hàng đã ĐƯỢC XÁC NHẬN (CONFIRMED).' 
            });
        }

        // Muốn lên COMPLETED -> Thì trạng thái hiện tại phải là IN_PROGRESS
        if (status === 'COMPLETED' && booking.status !== 'IN_PROGRESS') {
             return res.status(400).json({ 
                success: false, 
                message: 'Chỉ có thể hoàn thành khi đơn hàng ĐANG THỰC HIỆN (IN_PROGRESS).' 
            });
        }

        // 5. Update Status
        booking.status = status;
        await booking.save();

        res.json({
            success: true,
            message: `Cập nhật trạng thái thành công: ${status}`,
            data: {
                id: booking.id,
                status: booking.status,
                updated_at: booking.updated_at
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAvailableCleanersForBooking,
    assignCleanerToBooking,
    getAllBookingsAdmin,
    updateBookingStatus
};