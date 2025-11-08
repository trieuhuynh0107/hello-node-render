const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateToken = async (req, res, next) => {
  let token;

  // 1. Kiểm tra xem header 'Authorization' có tồn tại và bắt đầu bằng 'Bearer' không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Lấy token ra khỏi header (ví dụ: "Bearer <token>" -> "<token>")
      token = req.headers.authorization.split(' ')[1];

      // 3. Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Lấy thông tin user từ database (trừ mật khẩu)
      // và gắn vào `req.user` để các hàm controller sau có thể dùng
      const userResult = await pool.query(
        'SELECT id, email, first_name, last_name, phone, role, status, created_at FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('Không tìm thấy người dùng.');
      }
      
      const user = userResult.rows[0];

      // (Logic từ WebBE.pdf) Kiểm tra user có 'active' không
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: { code: "AUTHZ_001", message: "Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt." }
        });
      }

      req.user = user;

      // 5. Cho phép request đi tiếp sang bước controller
      next();

    } catch (error) {
      console.error('Lỗi xác thực token:', error);
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_001", message: "Token không hợp lệ hoặc đã hết hạn." }
      });
    }
  }

  // 6. Nếu không có token
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: "AUTH_001", message: "Chưa đăng nhập. Vui lòng cung cấp token." }
    });
  }
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Kiểm tra xem req.user (đã được authenticateToken gắn vào)
    // có vai trò (role) nằm trong danh sách các vai trò được phép (allowedRoles) không.
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      // 403 Forbidden
      return res.status(403).json({
        success: false,
        error: { code: "AUTHZ_001", message: "Bạn không có quyền thực hiện hành động này." }
      });
    }
    
    // 2. Nếu có quyền, cho đi tiếp
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
};