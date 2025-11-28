const express = require('express');
const router = express.Router();

// 1. Import Middleware
const authenticate = require('../middlewares/auth');
const adminOnly = require('../middlewares/adminOnly');
const {getUploadMiddleware} = require('../services/uploadService');
const upload = getUploadMiddleware();

// 2. Import Validators
const {
  createServiceValidation,
  updateServiceValidation,
  idParamValidation,
  validate
} = require('../validators/serviceValidator');

// 3. Import Controllers
const serviceController = require('../controllers/serviceController'); 
const bookingController = require('../controllers/bookingController');
const cleanerController = require('../controllers/cleanerController'); 
const adminStatisticalController = require('../controllers/adminStatisticalController'); 

// ============================================
// GLOBAL MIDDLEWARE
// ============================================
router.use(authenticate);
router.use(adminOnly);


// ============================================
// 1. SERVICE MANAGEMENT
// ============================================

// Lấy danh sách block schemas
router.get('/services/block-schemas', serviceController.getBlockSchemas);

// Xem tất cả dịch vụ (Admin View)
router.get('/services', serviceController.getAdminServices); 

// Lấy chi tiết service để edit
router.get(
  '/services/:id',
  idParamValidation,
  validate,
  serviceController.getServiceForEdit
);

// Tạo dịch vụ mới
router.post(
  '/services',
  createServiceValidation,
  validate,
  serviceController.createService
);

// Cập nhật dịch vụ
router.put(
  '/services/:id',
  updateServiceValidation,
  validate,
  serviceController.updateService
);

// Cập nhật layout
router.put(
  '/services/:id/layout',
  idParamValidation,
  validate,
  serviceController.updateServiceLayout
);

// Bật/Tắt dịch vụ
router.patch(
  '/services/:id/toggle',
  idParamValidation,
  validate,
  serviceController.toggleService
);

// Xóa dịch vụ
router.delete(
  '/services/:id',
  idParamValidation,
  validate,
  serviceController.deleteService
);


// ============================================
// 2. CLEANER MANAGEMENT
// ============================================
router.post('/cleaners', upload.single('avatar'),cleanerController.createCleaner);
router.get('/cleaners', cleanerController.getAllCleaners);
router.get('/cleaners/:id', cleanerController.getCleanerById);
router.put('/cleaners/:id/status', cleanerController.updateCleanerStatus);


// ============================================
// 3. BOOKING ASSIGNMENT
// ============================================
router.get('/bookings', bookingController.getAllBookings);
router.get('/bookings/:bookingId/available-cleaners', bookingController.getAvailableCleaners);
router.post('/bookings/assign', bookingController.assignCleaner);
router.put('/bookings/:id/status', bookingController.updateStatus);


// ============================================
// 4. STATISTICAL & DASHBOARD
// ============================================
router.get('/stats/dashboard', adminStatisticalController.getDashboardStats);

module.exports = router;