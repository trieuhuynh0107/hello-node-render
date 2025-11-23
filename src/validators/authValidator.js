const { body, validationResult } = require('express-validator');

/**
 * Validation rules cho Register
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Họ tên không được để trống')
    .isLength({ max: 100 })
    .withMessage('Họ tên không quá 100 ký tự'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại phải là 10-11 chữ số')
];

/**
 * Validation rules cho Login
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống')
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
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  validate
};