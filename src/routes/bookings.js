const express = require('express');
const router = express.Router();

// Import "bộ não" controller
const bookingController = require('../../controllers/bookingController');

// Import 2 "người bảo vệ" (middleware)
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// === ĐỊNH NGHĨA ROUTE ===

/**
 * API #6: POST /api/bookings
 * Tạo một đơn hàng mới.
 *
 * Quy trình:
 * 1. authenticateToken: Kiểm tra xem đã đăng nhập chưa (lấy req.user).
 * 2. authorizeRole('customer'): Kiểm tra xem req.user.role có phải là 'customer' không.
 * 3. bookingController.createBooking: Nếu 2 bước trên OK, chạy logic tạo đơn hàng.
 */
router.post(
  '/', 
  authenticateToken, 
  authorizeRole('customer'), 
  bookingController.createBooking
);

// (Sau này chúng ta sẽ thêm các route khác như GET /bookings... vào đây)

module.exports = router;