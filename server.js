// server.js - File chính để khởi chạy server

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

// Khởi tạo app Express
const app = express();

// Lấy PORT từ biến môi trường hoặc dùng mặc định là 5000
const PORT = process.env.PORT || 5000;

// Middleware
// Cho phép các request từ những nguồn khác (ví dụ: frontend Vercel)
app.use(cors());

// DÒNG MỚI QUAN TRỌNG:
// "Dạy" Express cách đọc (parse) JSON từ req.body
// Dòng này PHẢI được đặt TRƯỚC khi các route được sử dụng.
app.use(express.json());

// Sử dụng các route đã được định nghĩa trong file ./routes/api.js
// Tất cả các route trong file đó sẽ có tiền tố là /api
app.use('/api', apiRoutes);

// Khởi động server và lắng nghe ở port đã định
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
