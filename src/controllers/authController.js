const { User } = require('../models');
const { generateToken } = require('../utils/jwtHelper');

/**
 * POST /api/auth/register
 * Đăng ký tài khoản Customer mới
 */
const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.body;

    // Kiểm tra email đã tồn tại chưa (paranoid query: chỉ tìm records chưa xóa)
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Tạo user mới với role CUSTOMER
    const user = await User.create({
      email,
      password_hash: password, // beforeCreate hook sẽ tự động hash
      full_name,
      phone,
      role: 'CUSTOMER' // Mặc định là CUSTOMER
    });

    // Tạo JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Response
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Đăng nhập (ADMIN hoặc CUSTOMER)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Response
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Lấy thông tin profile của user hiện tại
 * Requires: authenticate middleware
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user đã được set bởi authenticate middleware
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.full_name,
          phone: req.user.phone,
          role: req.user.role,
          created_at: req.user.created_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile
};