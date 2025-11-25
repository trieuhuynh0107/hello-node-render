const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authenticate = require('../middlewares/auth');

// --- THÊM ĐOẠN NÀY ĐỂ DEBUG ---
console.log('CHECK 1 - Auth Middleware:', authenticate);
console.log('CHECK 2 - Controller Object:', bookingController);
console.log('CHECK 3 - CreateBooking Function:', bookingController?.createBooking);
// ============================================
// BOOKING ROUTES (Customer only)
// ============================================

// Tạo booking mới
router.post('/', authenticate, bookingController.createBooking);

// Lấy danh sách booking của customer
// Query: ?status=PENDING|CONFIRMED|COMPLETED|CANCELLED
router.get('/', authenticate, bookingController.getMyBookings);

// Lấy chi tiết 1 booking
router.get('/:id', authenticate, bookingController.getBookingDetail);

// Hủy booking
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);

module.exports = router;