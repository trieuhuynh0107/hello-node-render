const { Service, Booking } = require('../models');
const { BLOCK_TYPES, BLOCK_SCHEMAS, validateBlock } = require('../config/blockSchemas');

/**
 * GET /api/admin/services
 * Admin xem tất cả dịch vụ (bao gồm cả inactive)
 */
const getAllServicesAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = {};
    
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    const services = await Service.findAll({
      where,
      attributes: ['id', 'name', 'description', 'base_price', 'duration_minutes', 'is_active', 'created_at'],
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
 * GET /api/admin/services/:id
 * Lấy chi tiết service (bao gồm layout_config) để edit
 */
const getServiceForEdit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);

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

/**
 * POST /api/admin/services
 * Tạo dịch vụ mới (với layout_config mặc định)
 */
const createService = async (req, res, next) => {
  try {
    const { name, description, base_price, duration_minutes, layout_config } = req.body;

    // Validation cơ bản
    if (!name || !base_price || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: name, base_price, duration_minutes'
      });
    }

    if (base_price <= 0 || duration_minutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá và thời gian phải lớn hơn 0'
      });
    }

    // Validate layout_config nếu được gửi lên
    let validatedLayoutConfig = [];
    
    if (layout_config && Array.isArray(layout_config)) {
      for (const block of layout_config) {
        const validation = validateBlock(block.type, block.data);
        
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: `Block "${block.type}" không hợp lệ`,
            errors: validation.errors
          });
        }
      }
      validatedLayoutConfig = layout_config;
    }

    // Tạo service
    const service = await Service.create({
      name,
      description,
      base_price,
      duration_minutes,
      layout_config: validatedLayoutConfig,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'Tạo dịch vụ thành công',
      data: { service }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/services/:id
 * Cập nhật thông tin dịch vụ (bao gồm layout_config)
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, base_price, duration_minutes, layout_config } = req.body;

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Validation
    if (base_price !== undefined && base_price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá dịch vụ phải lớn hơn 0'
      });
    }

    if (duration_minutes !== undefined && duration_minutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian thực hiện phải lớn hơn 0'
      });
    }

    // Validate layout_config nếu được gửi lên
    if (layout_config && Array.isArray(layout_config)) {
      for (const block of layout_config) {
        const validation = validateBlock(block.type, block.data);
        
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: `Block "${block.type}" không hợp lệ`,
            errors: validation.errors
          });
        }
      }
    }

    // Update
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (layout_config !== undefined) updateData.layout_config = layout_config;

    await service.update(updateData);

    res.json({
      success: true,
      message: 'Cập nhật dịch vụ thành công',
      data: { service }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/services/:id/layout
 * Cập nhật riêng layout_config (dành cho Page Builder)
 * ⭐ API chính cho Admin React Page Builder
 */
const updateServiceLayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { layout_config } = req.body;

    if (!Array.isArray(layout_config)) {
      return res.status(400).json({
        success: false,
        message: 'layout_config phải là array'
      });
    }

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Validate từng block
    for (let i = 0; i < layout_config.length; i++) {
      const block = layout_config[i];
      
      if (!block.type || !block.data) {
        return res.status(400).json({
          success: false,
          message: `Block thứ ${i + 1} thiếu "type" hoặc "data"`
        });
      }

      const validation = validateBlock(block.type, block.data);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: `Block thứ ${i + 1} (${block.type}) không hợp lệ`,
          errors: validation.errors
        });
      }
    }

    // Update layout
    await service.update({ layout_config });

    res.json({
      success: true,
      message: 'Cập nhật layout thành công',
      data: {
        service_id: service.id,
        layout_config: service.layout_config
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/services/block-schemas
 * Lấy danh sách block types và schemas
 * Dành cho Admin UI render form động
 */
const getBlockSchemas = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        block_types: BLOCK_TYPES,
        schemas: BLOCK_SCHEMAS
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/services/:id/toggle
 * Bật/Tắt dịch vụ
 */
const toggleService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    const newStatus = !service.is_active;
    await service.update({ is_active: newStatus });

    res.json({
      success: true,
      message: newStatus 
        ? 'Đã bật dịch vụ. Khách hàng có thể đặt lịch.'
        : 'Đã tắt dịch vụ. Khách hàng không thể đặt lịch nữa.',
      data: { 
        service,
        is_active: newStatus
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/services/:id
 * Xóa dịch vụ (chỉ nếu chưa có booking)
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Kiểm tra booking
    const bookingCount = await Booking.count({
      where: { service_id: id }
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa dịch vụ này vì đã có ${bookingCount} đơn hàng sử dụng. Hãy dùng chức năng Tắt dịch vụ thay thế.`
      });
    }

    await service.destroy();

    res.json({
      success: true,
      message: 'Đã xóa dịch vụ thành công'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServicesAdmin,
  getServiceForEdit,
  createService,
  updateService,
  updateServiceLayout,
  getBlockSchemas,
  toggleService,
  deleteService
};