// Import các thư viện cần thiết
const pool = require('../src/config/db'); // Pool kết nối database
const bcrypt = require('bcryptjs'); // Thư viện băm mật khẩu
const jwt = require('jsonwebtoken'); // Thư viện tạo token

// Hàm xử lý logic đăng ký
const register = async (req, res) => {
  try {
    // 1. Lấy dữ liệu từ body của request
    const { email, password, first_name, last_name, phone, role } = req.body;

    // 2. Kiểm tra dữ liệu đầu vào (Validation cơ bản)
    if (!email || !password || !role) {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: "VAL_001", 
          message: "Email, password, và role là bắt buộc." 
        }
      });
    }

    // 3. Kiểm tra xem email đã tồn tại chưa
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userExists.rows.length > 0) {
      return res.status(409).json({ // 409 Conflict (Theo mã lỗi AUTH_004 của bạn)
        success: false,
        error: { 
          code: "AUTH_004", 
          message: "Email này đã tồn tại." 
        }
      });
    }

    // 4. Băm (hash) mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 5. Xác định trạng thái (status) dựa trên vai trò (role)
    // Đây là logic nghiệp vụ quan trọng từ file WebBE.pdf của bạn
    const status = (role === 'cleaner') ? 'pending' : 'active';

    // 6. Thêm người dùng mới vào database
    const newUserQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, phone, role, status, created_at;
    `;
    const newUserResult = await pool.query(newUserQuery, [
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role,
      status
    ]);

    const newUser = newUserResult.rows[0];

    // 7. Tạo JWT token
    // process.env.JWT_SECRET là biến bí mật chúng ta sẽ thêm vào file .env
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token hết hạn sau 1 ngày
    );

    // 8. Trả về thành công (201 Created)
    res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      data: {
        user: newUser,
        token: token
      }
    });

  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    res.status(500).json({ 
      success: false,
      error: { 
        code: "SERVER_ERROR", 
        message: "Lỗi máy chủ nội bộ." 
      }
    });
  }
};

//Hàm xử lý logic đăng nhập 
const login = async (req, res) => {
  try {
    // 1. Lấy email và password từ body
    const { email, password } = req.body;

    // 2. Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "VAL_001", message: "Email và password là bắt buộc." }
      });
    }

    // 3. Tìm user trong database bằng email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    // 4. Nếu không tìm thấy user
    if (userResult.rows.length === 0) {
      return res.status(401).json({ // 401 Unauthorized
        success: false,
        error: { code: "AUTH_001", message: "Email hoặc mật khẩu không hợp lệ." }
      });
    }

    const user = userResult.rows[0];

    // 5. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // 6. Nếu mật khẩu không khớp
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_001", message: "Email hoặc mật khẩu không hợp lệ." }
      });
    }

    // 7. (Logic từ WebBE.pdf) Kiểm tra xem tài khoản đã được kích hoạt chưa
    if (user.status !== 'active') {
      let message = 'Tài khoản của bạn chưa được kích hoạt.';
      if (user.status === 'pending') message = 'Tài khoản của bạn đang chờ duyệt.';
      if (user.status === 'suspended') message = 'Tài khoản của bạn đã bị khóa.';
      
      return res.status(403).json({ // 403 Forbidden
        success: false,
        error: { code: "AUTHZ_001", message: message }
      });
    }

    // 8. Tạo JWT token (nếu mọi thứ đều ổn)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 9. Xóa password_hash trước khi gửi về client
    delete user.password_hash;

    // 10. Trả về thành công (200 OK)
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      data: {
        user: user,
        token: token
      }
    });

  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ 
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi máy chủ nội bộ." }
    });
  }
};

const getMe = async (req, res) => {
  
  res.status(200).json({
    success: true,
    data: {
      user: req.user // Trả về user đã được middleware tìm thấy
    }
  });
};

// Xuất hàm register để file route có thể dùng
module.exports = {
  register,
  login,
  getMe,
};