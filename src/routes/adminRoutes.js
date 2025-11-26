const express = require('express');
const router = express.Router();

// 1. Import Middleware
const authenticate = require('../middlewares/auth');
const adminOnly = require('../middlewares/adminOnly');

// 2. Import Validators
const {
  createServiceValidation,
  updateServiceValidation,
  idParamValidation,
  validate
} = require('../validators/serviceValidator');

// 3. Import Controllers
const adminServiceController = require('../controllers/adminServiceController');
const adminBookingController = require('../controllers/adminBookingController');
const cleanerController = require('../controllers/cleanerController'); 
const adminStatisticalController = require('../controllers/adminStatisticalController'); 

// ============================================
// GLOBAL MIDDLEWARE
// ============================================
// Tất cả các route bên dưới dòng này đều bắt buộc phải Login + là Admin
router.use(authenticate);
router.use(adminOnly);


// ============================================
// 1. SERVICE MANAGEMENT
// ============================================

// Lấy danh sách block schemas (Page Builder)
router.get('/services/block-schemas', adminServiceController.getBlockSchemas);

// Xem tất cả dịch vụ
router.get('/services', adminServiceController.getAllServicesAdmin);

// Lấy chi tiết service để edit
router.get(
  '/services/:id',
  idParamValidation,
  validate,
  adminServiceController.getServiceForEdit
);

// Tạo dịch vụ mới
router.post(
  '/services',
  createServiceValidation,
  validate,
  adminServiceController.createService
);

// Cập nhật dịch vụ
router.put(
  '/services/:id',
  updateServiceValidation,
  validate,
  adminServiceController.updateService
);

// Cập nhật layout (Page Builder)
router.put(
  '/services/:id/layout',
  idParamValidation,
  validate,
  adminServiceController.updateServiceLayout
);

// Bật/Tắt dịch vụ
router.patch(
  '/services/:id/toggle',
  idParamValidation,
  validate,
  adminServiceController.toggleService
);

// Xóa dịch vụ
router.delete(
  '/services/:id',
  idParamValidation,
  validate,
  adminServiceController.deleteService
);


// ============================================
// 2. CLEANER MANAGEMENT (Quản lý nhân viên)
// ============================================
// 🔥 Thêm phần này để quản lý nhân viên (Tạo, Xem, Đổi trạng thái)

router.post('/cleaners', cleanerController.createCleaner);
router.get('/cleaners', cleanerController.getAllCleaners);
router.put('/cleaners/:id/status', cleanerController.updateCleanerStatus);


// ============================================
// 3. BOOKING ASSIGNMENT (Điều phối đơn hàng)
// ============================================-

// 1. Lấy danh sách tất cả đơn hàng (Có lọc status, date...)
router.get('/bookings', adminBookingController.getAllBookingsAdmin);

// 2. Xem danh sách ai rảnh cho đơn hàng X
router.get('/bookings/:bookingId/available-cleaners', adminBookingController.getAvailableCleanersForBooking);

// 3. Thực hiện gán nhân viên
router.post('/bookings/assign', adminBookingController.assignCleanerToBooking);

// 4. Cập nhật trạng thái đơn hàng
router.put('/bookings/:id/status', adminBookingController.updateBookingStatus);

// ============================================
// 4. STATISTICAL & DASHBOARD (Thống kê)
// ============================================

// API lấy toàn bộ số liệu cho Dashboard
router.get('/stats/dashboard', adminStatisticalController.getDashboardStats);

module.exports = router;