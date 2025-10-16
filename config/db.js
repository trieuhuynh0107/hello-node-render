// Import thư viện dotenv để đọc file .env
require('dotenv').config();

// Import lớp Pool từ thư viện pg
const { Pool } = require('pg');

// Tạo một "pool" kết nối.
// Pool sẽ quản lý nhiều kết nối cùng lúc để tối ưu hiệu suất.
// Nó sẽ tự động sử dụng biến môi trường DATABASE_URL mà chúng ta đã định nghĩa trong file .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Khi deploy lên Render, có thể cần cấu hình SSL
  ssl: {
    rejectUnauthorized: false
  }
});

// Xuất pool để các file khác trong dự án có thể sử dụng để truy vấn database
module.exports = pool;
