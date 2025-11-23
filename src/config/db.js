// Import thư viện dotenv để đọc file .env
require('dotenv').config();

// Import lớp Pool từ thư viện pg
const { Pool } = require('pg');

// Tạo một "pool" kết nối.
// Nó sẽ tự động sử dụng biến môi trường DATABASE_URL
// mà chúng ta đã định nghĩa trong file .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Khi chạy localhost, chúng ta KHÔNG cần cấu hình SSL
});

// Xuất pool để các file khác trong dự án có thể sử dụng
module.exports = pool;