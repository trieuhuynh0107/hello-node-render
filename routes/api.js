// routes/api.js - "Tổng đài chính" điều phối các API

const express = require('express');
const router = express.Router();

// --- Import các Controllers & Routers con ---
const serviceController = require('../controllers/serviceController');

// DÒNG MỚI 1: Import "tổng đài nhánh" cho việc xác thực (auth)
const authRoutes = require('./auth');

const bookingRoutes = require('./bookings');

// --- Phân phối các Route ---

// DÒNG MỚI 2: Chuyển tiếp tất cả request /api/auth/... cho authRoutes xử lý
router.use('/auth', authRoutes);

// (Sau này, chúng ta sẽ thêm các router khác vào đây)
// ví dụ: router.use('/bookings', bookingRoutes);

// --- Các route cho Dịch vụ (services) ---
// (Chúng ta vẫn có thể giữ các route đơn giản ở đây)

// Định nghĩa route GET /api/services
router.get('/services', serviceController.getServices);

// Định nghĩa route GET /api/services/:id
router.get('/services/:id', serviceController.getServiceById);

router.use('/bookings', bookingRoutes);
// Xuất router để có thể sử dụng ở file server.js
module.exports = router;