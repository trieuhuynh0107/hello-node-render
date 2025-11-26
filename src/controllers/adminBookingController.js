// src/controllers/adminBookingController.js
const { Booking, Cleaner, Service } = require('../models');
const { Op } = require('sequelize');

// ==========================================
// HELPER: KIỂM TRA TRÙNG LỊCH (CORE LOGIC)
// ==========================================
const checkCleanerAvailability = async (cleanerId, newStartTime, newEndTime) => {
    const BUFFER_MINUTES = 30; // Thời gian di chuyển/nghỉ ngơi
    const bufferMs = BUFFER_MINUTES * 60 * 1000;

    const newStart = new Date(newStartTime);
    const newEnd = new Date(newEndTime);

    // Tìm xem có bất kỳ booking nào của cleaner này vi phạm khoảng thời gian trên không
    const conflictBooking = await Booking.findOne({
        where: {
            cleaner_id: cleanerId,
            status: { [Op.in]: ['CONFIRMED', 'PENDING'] }, // Chỉ check các đơn đang active
            [Op.and]: [
                {
                    // Logic: Tìm lịch CŨ mà...
                    // Start Cũ < End Mới + Buffer
                    start_time: { 
                        [Op.lt]: new Date(newEnd.getTime() + bufferMs) 
                    },
                    // VÀ End Cũ + Buffer > Start Mới
                    end_time: { 
                        [Op.gt]: new Date(newStart.getTime() - bufferMs) 
                    }
                }
            ]
        }
    });

    // Nếu tìm thấy conflictBooking -> Tức là Bận -> Return false (Không available)
    // Nếu không tìm thấy -> Return true (Available)
    return !conflictBooking;
};

// ==========================================
// 1. API: GỢI Ý NHÂN VIÊN RẢNH
// ==========================================
// GET /api/admin/bookings/:bookingId/available-cleaners
const getAvailableCleanersForBooking = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        // Lấy thông tin booking cần gán
        const booking = await Booking.findByPk(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });

        // Lấy tất cả nhân viên đang đi làm (ACTIVE)
        const allCleaners = await Cleaner.findAll({ 
            where: { status: 'ACTIVE' },
            attributes: ['id', 'name', 'phone', 'status'] // Chỉ lấy info cần thiết
        });

        const availableCleaners = [];

        // Duyệt qua từng nhân viên để check lịch
        // (Lưu ý: Nếu số lượng nhân viên lớn > 100, cần tối ưu query này bằng SQL raw, nhưng với quy mô nhỏ thì loop này OK)
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
// POST /api/admin/bookings/assign
const assignCleanerToBooking = async (req, res, next) => {
    try {
        const { booking_id, cleaner_id } = req.body;

        // 1. Check Booking
        const booking = await Booking.findByPk(booking_id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: 'Không thể gán nhân viên cho đơn đã hủy hoặc hoàn thành.' });
        }

        // 2. Check Cleaner
        const cleaner = await Cleaner.findByPk(cleaner_id);
        if (!cleaner) return res.status(404).json({ success: false, message: 'Cleaner not found' });
        if (cleaner.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'Nhân viên này đang nghỉ hoặc không hoạt động.' });

        // 3. Check Conflict Lần Cuối (Double check quan trọng)
        const isAvailable = await checkCleanerAvailability(cleaner_id, booking.start_time, booking.end_time);
        if (!isAvailable) {
            return res.status(409).json({ 
                success: false, 
                message: 'Nhân viên này vừa nhận một lịch khác bị trùng giờ. Vui lòng chọn người khác.' 
            });
        }

        // 4. Update
        booking.cleaner_id = cleaner_id;
        booking.status = 'CONFIRMED'; // Đổi trạng thái từ PENDING -> CONFIRMED
        await booking.save();

        res.json({
            success: true,
            message: `Đã gán nhân viên ${cleaner.name} thành công!`,
            data: booking
        });

    } catch (error) { next(error); }
};

module.exports = {
    getAvailableCleanersForBooking,
    assignCleanerToBooking
};