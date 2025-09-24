const express = require('express');
const app = express();
// Render sẽ tự cung cấp PORT qua biến môi trường
const port = process.env.PORT || 3000;

// Định nghĩa một route cho trang chủ
app.get('/', (req, res) => {
  res.send('Hello World from Node.js App!');
});

// Lắng nghe ở port đã định
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});