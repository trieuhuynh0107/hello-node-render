const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token
 * @param {Object} payload - Data cần encode vào token
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token cần verify
 * @returns {Object} Decoded payload
 * @throws {Error} Nếu token không hợp lệ
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token đã hết hạn');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token không hợp lệ');
    }
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken
};