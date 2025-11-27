// src/controllers/bookingController.js
const bookingService = require('../services/bookingService');
const { Booking, Cleaner, Service, User } = require('../models'); // Vẫn cần import model cho các hàm get detail đơn giản

// ==========================================
// 1. CREATE BOOKING (Customer)
// ==========================================
const createBooking = async (req, res, next) => {
    try {
        const customerId = req.user.id || req.user.userId;
        const booking = await bookingService.createBookingCore(customerId, req.body);
        
        // Fetch lại để hiển thị đầy đủ info service
        const result = await Booking.findByPk(booking.id, {
            include: [{ model: Service, as: 'service', attributes: ['name', 'base_price'] }]
        });

        res.status(201).json({ success: true, message: 'Đặt lịch thành công!', data: result });
    } catch (error) {
        if (error.message === 'SERVICE_NOT_FOUND') return res.status(404).json({ success: false, message: 'Dịch vụ không tồn tại' });
        if (error.message === 'VALIDATION_ERROR') return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: error.details });
        next(error);
    }
};

// ==========================================
// 2. ASSIGN CLEANER (Admin)
// ==========================================
const assignCleaner = async (req, res, next) => {
    try {
        const { booking_id, cleaner_id } = req.body;
        const result = await bookingService.assignCleanerCore(booking_id, cleaner_id);
        
        res.json({ 
            success: true, 
            message: `Đã gán nhân viên ${result.cleaner.name} thành công!`,
            data: result.booking 
        });
    } catch (error) {
        if (error.message === 'CONFLICT_SCHEDULE') return res.status(409).json({ success: false, message: 'Nhân viên bị trùng lịch!' });
        if (error.message === 'CLEANER_UNAVAILABLE') return res.status(400).json({ success: false, message: 'Nhân viên không hoạt động' });
        next(error);
    }
};

// ==========================================
// 3. GET LIST (Admin)
// ==========================================
const getAllBookings = async (req, res, next) => {
    try {
        const { count, rows } = await bookingService.getAllBookingsCore(req.query);
        res.json({
            success: true,
            data: {
                bookings: rows,
                pagination: {
                    totalItems: count,
                    totalPages: Math.ceil(count / (req.query.limit || 10)),
                    currentPage: parseInt(req.query.page || 1)
                }
            }
        });
    } catch (error) { next(error); }
};

// ==========================================
// 4. CÁC HÀM NHỎ LẺ KHÁC (Get Detail, Cancel, Update Status)
// ==========================================
// Giữ lại các logic đơn giản này trong Controller hoặc chuyển sang Service nếu muốn triệt để

const getAvailableCleaners = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findByPk(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: 'Not found' });

        const allCleaners = await Cleaner.findAll({ where: { status: 'ACTIVE' } });
        const availableCleaners = [];

        for (const cleaner of allCleaners) {
            const isFree = await bookingService.checkCleanerAvailability(cleaner.id, booking.start_time, booking.end_time);
            if (isFree) availableCleaners.push(cleaner);
        }
        res.json({ success: true, data: availableCleaners });
    } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const booking = await Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: 'Not found' });

        // Validate Status Flow
        if (status === 'IN_PROGRESS' && booking.status !== 'CONFIRMED') return res.status(400).json({ message: 'Phải CONFIRMED mới được START' });
        if (status === 'COMPLETED' && booking.status !== 'IN_PROGRESS') return res.status(400).json({ message: 'Phải IN_PROGRESS mới được COMPLETE' });

        booking.status = status;
        await booking.save();
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) { next(error); }
};

// ==========================================
// CUSTOMER: LẤY DANH SÁCH CỦA TÔI
// ==========================================
const getMyBookings = async (req, res, next) => {
    try {
        const customerId = req.user.id || req.user.userId;
        const { status } = req.query;
        
        const whereCondition = { customer_id: customerId };
        if (status) whereCondition.status = status.toUpperCase();

        const bookings = await Booking.findAll({
            where: whereCondition,
            include: [
                { model: Service, as: 'service', attributes: ['name', 'base_price'] },
                { model: Cleaner, as: 'cleaner', attributes: ['name', 'phone'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({ success: true, data: bookings });
    } catch (error) { next(error); }
};

// ==========================================
// CUSTOMER: LẤY CHI TIẾT
// ==========================================
const getBookingDetail = async (req, res, next) => {
     try {
        const customerId = req.user.id || req.user.userId;
        const { id } = req.params;
        
        const booking = await Booking.findOne({
            where: { id, customer_id: customerId },
            include: [
                { model: Service, as: 'service' }, 
                { model: Cleaner, as: 'cleaner' }
            ]
        });
        
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, data: booking });
     } catch (error) { next(error); }
};

// ==========================================
// CUSTOMER: HỦY ĐƠN
// ==========================================
const cancelBooking = async (req, res, next) => {
    try {
        const customerId = req.user.id || req.user.userId;
        const { id } = req.params;

        const booking = await Booking.findOne({ where: { id, customer_id: customerId } });
        if (!booking) return res.status(404).json({ success: false, message: 'Not found' });

        if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(booking.status)) {
             return res.status(400).json({ success: false, message: 'Không thể hủy đơn này.' });
        }

        // Check thời gian 2 tiếng (Logic cũ)
        const CANCEL_HOURS = 2;
        const hoursDiff = (new Date(booking.start_time) - new Date()) / (1000 * 60 * 60);
        if (hoursDiff < CANCEL_HOURS) {
             return res.status(400).json({ success: false, message: 'Quá hạn hủy đơn.' });
        }

        booking.status = 'CANCELLED';
        if (req.body.cancel_reason) booking.cancel_reason = req.body.cancel_reason; // Lưu lý do nếu có
        
        await booking.save();
        res.json({ success: true, message: 'Đã hủy thành công' });
    } catch (error) { next(error); }
};

module.exports = {
    createBooking,
    assignCleaner,
    getAllBookings,
    getAvailableCleaners,
    updateStatus,
    getMyBookings,
    getBookingDetail,
    cancelBooking
};