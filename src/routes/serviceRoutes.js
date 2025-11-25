const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/serviceController');
const { idParamValidation, validate } = require('../validators/serviceValidator');

/**
 * @route   GET /api/services
 * @desc    Lấy danh sách dịch vụ (chỉ active)
 * @access  Public
 */
router.get('/', serviceController.getAllServices);

/**
 * @route   GET /api/services/:id
 * @desc    Lấy chi tiết 1 dịch vụ (bao gồm layout_config)
 * @access  Public
 */
router.get(
  '/:id',
  idParamValidation,
  validate,
  serviceController.getServiceById
);

/**
 * @route   GET /api/services/:id/preview
 * @desc    Preview service (bao gồm inactive)
 * @access  Public (nhưng nên bảo vệ bằng secret token trong thực tế)
 */
router.get(
  '/:id/preview',
  idParamValidation,
  validate,
  serviceController.previewService
);

module.exports = router;