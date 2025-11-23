const { body, param, validationResult } = require('express-validator');

/**
 * Validation cho tạo dịch vụ mới
 */
const createServiceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên dịch vụ không được để trống')
    .isLength({ max: 100 })
    .withMessage('Tên dịch vụ không quá 100 ký tự'),

  body('description')
    .optional()
    .trim(),

  body('base_price')
    .isFloat({ min: 0.01 })
    .withMessage('Giá dịch vụ phải là số dương'),

  body('duration_minutes')
    .isInt({ min: 1 })
    .withMessage('Thời gian thực hiện phải là số nguyên dương (phút)')
];

/**
 * Validation cho update dịch vụ
 */
const updateServiceValidation = [
  param('id')
    .isInt()
    .withMessage('ID không hợp lệ'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tên dịch vụ không được để trống')
    .isLength({ max: 100 })
    .withMessage('Tên dịch vụ không quá 100 ký tự'),

  body('description')
    .optional()
    .trim(),

  body('base_price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Giá dịch vụ phải là số dương'),

  body('duration_minutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Thời gian thực hiện phải là số nguyên dương (phút)')
];

/**
 * Validation cho ID param
 */
const idParamValidation = [
  param('id')
    .isInt()
    .withMessage('ID không hợp lệ')
];

/**
 * Middleware: Check validation result
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

module.exports = {
  createServiceValidation,
  updateServiceValidation,
  idParamValidation,
  validate
};