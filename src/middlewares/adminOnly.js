/**
 * Middleware: Kiểm tra user có role ADMIN không
 * Phải sử dụng sau middleware authenticate
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Chưa xác thực'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập. Chỉ dành cho Admin.'
    });
  }

  next();
};

module.exports = adminOnly;