const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authenticate = require('../middlewares/auth');
const { 
  registerValidation, 
  loginValidation, 
  validate 
} = require('../validators/authValidator');

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản Customer
 * @access  Public
 */
router.post(
  '/register',
  registerValidation,
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập
 * @access  Public
 */
router.post(
  '/login',
  loginValidation,
  validate,
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin profile
 * @access  Private (cần JWT token)
 */
router.get(
  '/me',
  authenticate,
  authController.getProfile
);

module.exports = router;