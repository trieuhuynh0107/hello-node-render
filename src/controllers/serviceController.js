const { Service } = require('../models');

/**
 * GET /api/services
 * Lấy danh sách dịch vụ (chỉ hiển thị dịch vụ đang active)
 * Public API - Không cần authentication
 */
const getAllServices = async (req, res, next) => {
  try {
    const services = await Service.findAll({
      where: {
        is_active: true  // Chỉ lấy dịch vụ đang hoạt động
      },
      attributes: ['id', 'name', 'description', 'base_price', 'duration_minutes'],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        services,
        total: services.length
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/:id
 * Lấy chi tiết 1 dịch vụ
 * Public API
 */
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findOne({
      where: {
        id,
        is_active: true  // Chỉ cho xem dịch vụ đang active
      },
      attributes: ['id', 'name', 'description', 'base_price', 'duration_minutes']
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    res.json({
      success: true,
      data: { service }
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAllServices,
  getServiceById
};

