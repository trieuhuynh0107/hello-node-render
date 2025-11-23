const { verifyToken } = require('../utils/jwtHelper');
const { User } = require('../models');

/**
 * Middleware: Xác thực JWT token
 * Attach user info vào req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token
    const decoded = verifyToken(token);

    // Tìm user trong database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] } // Không trả về password
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Attach user vào request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token không hợp lệ'
    });
  }
};

module.exports = authenticate;