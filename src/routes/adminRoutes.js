const express = require('express');
const router = express.Router();

const authenticate = require('../middlewares/auth');
const adminOnly = require('../middlewares/adminOnly');
const adminServiceController = require('../controllers/adminServiceController');
const {
  createServiceValidation,
  updateServiceValidation,
  idParamValidation,
  validate
} = require('../validators/serviceValidator');

// Tất cả routes dưới đây đều cần authenticate + adminOnly
router.use(authenticate);
router.use(adminOnly);

// ============================================
// SERVICE MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/services
 * @desc    Xem tất cả dịch vụ (bao gồm inactive)
 * @access  Admin only
 * @query   ?status=active|inactive (optional)
 */
router.get('/services', adminServiceController.getAllServicesAdmin);

/**
 * @route   POST /api/admin/services
 * @desc    Tạo dịch vụ mới
 * @access  Admin only
 */
router.post(
  '/services',
  createServiceValidation,
  validate,
  adminServiceController.createService
);

/**
 * @route   PUT /api/admin/services/:id
 * @desc    Cập nhật dịch vụ
 * @access  Admin only
 */
router.put(
  '/services/:id',
  updateServiceValidation,
  validate,
  adminServiceController.updateService
);

/**
 * @route   PATCH /api/admin/services/:id/toggle
 * @desc    Bật/Tắt dịch vụ
 * @access  Admin only
 */
router.patch(
  '/services/:id/toggle',
  idParamValidation,
  validate,
  adminServiceController.toggleService
);

/**
 * @route   DELETE /api/admin/services/:id
 * @desc    Xóa dịch vụ (chỉ nếu chưa có booking)
 * @access  Admin only
 */
router.delete(
  '/services/:id',
  idParamValidation,
  validate,
  adminServiceController.deleteService
);

module.exports = router;