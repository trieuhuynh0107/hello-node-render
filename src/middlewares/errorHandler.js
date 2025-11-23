/**
 * Global Error Handler Middleware
 * Bắt tất cả errors trong application
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Email đã tồn tại trong hệ thống'
    });
  }

  // Sequelize Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu tham chiếu không hợp lệ'
    });
  }

  // JWT Errors (backup, nếu không bắt được ở middleware)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;