const express = require('express');
const router = express.Router();

// 1. Import Controller (Đã gộp)
const serviceController = require('../controllers/serviceController');

// 2. Import Validators
const { idParamValidation, validate } = require('../validators/serviceValidator');

// ============================================
// PUBLIC ROUTES (Ai cũng truy cập được)
// ============================================

/**
 * @route   GET /api/services
 * @desc    Lấy danh sách dịch vụ (chỉ active)
 * @access  Public
 */
// 🔥 SỬA: getAllServices -> getPublicServices
router.get('/', serviceController.getPublicServices);

/**
 * @route   GET /api/services/:id
 * @desc    Lấy chi tiết 1 dịch vụ (bao gồm layout_config)
 * @access  Public
 */
// 🔥 SỬA: getServiceById -> getServiceDetail
router.get(
  '/:id',
  idParamValidation,
  validate,
  serviceController.getServiceDetail
);

module.exports = router;