// Import "pool" kết nối đã được cấu hình từ file db.js
const pool = require('../config/db');

// Hàm để lấy danh sách tất cả dịch vụ từ database
const getServices = async (req, res) => {
  try {
    // Gửi một câu lệnh SQL tới database để lấy tất cả các cột từ bảng services
    const result = await pool.query('SELECT * FROM services');
    
    // Dữ liệu trả về nằm trong result.rows
    res.status(200).json(result.rows);
  } catch (error) {
    // Nếu có lỗi, in ra console và trả về lỗi 500
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Hàm để lấy thông tin chi tiết của một dịch vụ từ database
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Gửi câu lệnh SQL có tham số ($1) để tránh lỗi bảo mật SQL Injection
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

    // Nếu không tìm thấy dịch vụ nào (result.rows rỗng)
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Trả về dịch vụ đầu tiên tìm được
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching service with id ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getServices,
  getServiceById,
};

