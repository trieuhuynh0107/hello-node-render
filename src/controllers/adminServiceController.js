const { Service } = require('../models');

/**
 * GET /api/admin/services
 * Admin xem tất cả dịch vụ (bao gồm cả inactive)
 */
const getAllServicesAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;  // Filter: ?status=active hoặc ?status=inactive

    const where = {};
    
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    const services = await Service.findAll({
      where,
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
 * POST /api/admin/services
 * Tạo dịch vụ mới
 */
const createService = async (req, res, next) => {
  try {
    const { name, description, base_price, duration_minutes } = req.body;

    // Validation
    if (!name || !base_price || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: name, base_price, duration_minutes'
      });
    }

    if (base_price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá dịch vụ phải lớn hơn 0'
      });
    }

    if (duration_minutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian thực hiện phải lớn hơn 0'
      });
    }

    // Tạo dịch vụ mới
    const service = await Service.create({
      name,
      description,
      base_price,
      duration_minutes,
      is_active: true  // Mặc định là active
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
 * Cập nhật thông tin dịch vụ
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, base_price, duration_minutes } = req.body;

    // Tìm dịch vụ
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

    // Update chỉ những field được gửi lên
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;

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
 * PATCH /api/admin/services/:id/toggle
 * Bật/Tắt dịch vụ (Soft delete pattern)
 * Đây là cách ĐÚNG thay vì hard delete
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

    // Đảo ngược trạng thái
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
 * Xóa dịch vụ (NGUY HIỂM - chỉ cho phép nếu chưa có booking nào)
 * Nên dùng toggle thay vì delete
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Booking } = require('../models');

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Kiểm tra xem có booking nào sử dụng dịch vụ này không
    const bookingCount = await Booking.count({
      where: { service_id: id }
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa dịch vụ này vì đã có ${bookingCount} đơn hàng sử dụng. Hãy dùng chức năng Tắt dịch vụ thay thế.`
      });
    }

    // Soft delete
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
  createService,
  updateService,
  toggleService,
  deleteService
};