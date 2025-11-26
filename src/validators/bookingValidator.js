// src/validator/bookingValidator.js
require('dotenv').config();

const validateBookingRequest = (req, res, next) => {
    try {
        // 🔥 THAY ĐỔI: Lấy booking_data thay vì start_time
        const { booking_data } = req.body;

        // 1. Kiểm tra cấu trúc dữ liệu
        if (!booking_data || !booking_data.booking_date || !booking_data.booking_time) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu thông tin ngày (booking_date) hoặc giờ (booking_time) trong booking_data." 
            });
        }

        // 2. Tự ghép chuỗi thời gian để kiểm tra
        const timeString = `${booking_data.booking_date}T${booking_data.booking_time}:00+07:00`;
        const bookingDate = new Date(timeString);
        const now = new Date();

        // 3. Kiểm tra định dạng
        if (isNaN(bookingDate.getTime())) {
            return res.status(400).json({ success: false, message: "Định dạng thời gian không hợp lệ." });
        }

        // ========================================================
        // 4. LOGIC BUSINESS (Giữ nguyên logic cũ)
        // ========================================================
        
        const BUFFER_MINUTES = parseInt(process.env.BUFFER_MINUTES || 30);
        const BOOKING_ADVANCE_DAYS = parseInt(process.env.BOOKING_ADVANCE_DAYS || 7);
        const WORK_START_HOUR = parseInt(process.env.WORK_START_HOUR || 7);
        const WORK_END_HOUR = parseInt(process.env.WORK_END_HOUR || 19);

        // --- CHECK A: QUÁ KHỨ & BUFFER ---
        const minBookingTime = new Date(now.getTime() + BUFFER_MINUTES * 60000);

        if (bookingDate < minBookingTime) {
            return res.status(400).json({
                success: false,
                message: `Vui lòng đặt lịch trước ít nhất ${BUFFER_MINUTES} phút so với hiện tại.`
            });
        }

        // --- CHECK B: TƯƠNG LAI QUÁ XA ---
        const maxBookingTime = new Date(now.getTime() + BOOKING_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
        
        if (bookingDate > maxBookingTime) {
             return res.status(400).json({
                success: false,
                message: `Chỉ được đặt lịch trong vòng ${BOOKING_ADVANCE_DAYS} ngày tới.`
            });
        }

        // --- CHECK C: GIỜ LÀM VIỆC ---
        const hour = bookingDate.getHours();
        
        if (hour < WORK_START_HOUR || hour >= WORK_END_HOUR) {
             return res.status(400).json({
                success: false,
                message: `Dịch vụ chỉ hoạt động từ ${WORK_START_HOUR}:00 đến ${WORK_END_HOUR}:00.`
            });
        }

        // Nếu hợp lệ -> Gán vào req để Controller dùng lại (đỡ phải parse lại lần nữa nếu muốn)
        // req.parsedStartTime = bookingDate; // (Optional)

        next();

    } catch (error) {
        console.error("Validator Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi validation hệ thống." });
    }
};

module.exports = { validateBookingRequest };