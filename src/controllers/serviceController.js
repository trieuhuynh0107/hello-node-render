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
 * Lấy chi tiết 1 dịch vụ (bao gồm layout_config)
 * Public API - Dành cho Vue.js render dynamic page
 */
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findOne({
      where: {
        id,
        is_active: true  // Chỉ cho xem dịch vụ đang active
      },
      attributes: [
        'id', 
        'name', 
        'description', 
        'base_price', 
        'duration_minutes',
        'layout_config'  // ⭐ Trả về layout config cho frontend
      ]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Parse layout_config nếu là string (tùy database)
    const layoutConfig = typeof service.layout_config === 'string' 
      ? JSON.parse(service.layout_config) 
      : service.layout_config;

    res.json({
      success: true,
      data: {
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          base_price: service.base_price,
          duration_minutes: service.duration_minutes,
          layout_config: layoutConfig  // Array of blocks
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/:id/preview
 * Preview service page (bao gồm cả inactive service)
 * Dành cho Admin preview trước khi publish
 */
const previewService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id, {
      attributes: ['id', 'name', 'description', 'base_price', 'duration_minutes', 'layout_config', 'is_active']
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    const layoutConfig = typeof service.layout_config === 'string' 
      ? JSON.parse(service.layout_config) 
      : service.layout_config;

    res.json({
      success: true,
      data: {
        service: {
          ...service.toJSON(),
          layout_config: layoutConfig
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  previewService
};