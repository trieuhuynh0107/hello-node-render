// controllers/serviceController.js - Chứa logic xử lý cho các request

// Import dữ liệu tĩnh từ các file JSON
const services = require('../data/services.json');
const serviceDetails = require('../data/serviceDetails.json');

// Hàm để lấy danh sách tất cả dịch vụ
const getServices = (req, res) => {
  // Trả về dữ liệu từ file services.json dưới dạng JSON
  res.status(200).json(services);
};

// Hàm để lấy thông tin chi tiết của một dịch vụ dựa trên ID
const getServiceById = (req, res) => {
  // Lấy id từ URL (vd: /api/services/1 -> req.params.id là '1')
  const { id } = req.params;

  // Tìm dịch vụ trong mảng serviceDetails có id trùng khớp
  // Dùng parseInt để chuyển id từ string sang number để so sánh
  const service = serviceDetails.find(s => s.id === parseInt(id));

  if (service) {
    // Nếu tìm thấy, trả về thông tin dịch vụ
    res.status(200).json(service);
  } else {
    // Nếu không tìm thấy, trả về lỗi 404
    res.status(404).json({ message: 'Service not found' });
  }
};

// Xuất các hàm để file routes/api.js có thể sử dụng
module.exports = {
  getServices,
  getServiceById,
};
