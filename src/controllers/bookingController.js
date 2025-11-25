const { Booking, Service, Cleaner } = require('../models');
const { Op } = require('sequelize');

// ============================================
// 1. HELPER FUNCTIONS (Private)
// ============================================

const validateDynamicFormData = (formSchema, bookingData) => {
  const errors = [];

  for (const field of formSchema) {
    const { field_name, field_type, label, required, validation } = field;
    const value = bookingData[field_name];

    // Check required
    if (required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: field_name,
        message: `${label} là bắt buộc`
      });
      continue;
    }

    // Skip validation if value is empty and not required
    if (!value && !required) continue;

    // Type validation
    switch (field_type) {
      case 'number':
        if (isNaN(value)) {
          errors.push({
            field: field_name,
            message: `${label} phải là số`
          });
        }
        if (validation) {
          if (validation.min !== undefined && Number(value) < validation.min) {
            errors.push({
              field: field_name,
              message: `${label} phải >= ${validation.min}`
            });
          }
          if (validation.max !== undefined && Number(value) > validation.max) {
            errors.push({
              field: field_name,
              message: `${label} phải <= ${validation.max}`
            });
          }
        }
        break;

      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          errors.push({
            field: field_name,
            message: `${label} phải là chuỗi`
          });
        }
        if (validation && validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors.push({
              field: field_name,
              message: `${label} không đúng định dạng`
            });
          }
        }
        break;

      case 'select':
        if (field.options && !field.options.includes(value)) {
          errors.push({
            field: field_name,
            message: `${label} không hợp lệ`
          });
        }
        break;

      case 'checkbox':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push({
            field: field_name,
            message: `${label} phải là true/false`
          });
        }
        break;

      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push({
            field: field_name,
            message: `${label} không phải ngày hợp lệ`
          });
        }
        break;

      case 'time':
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(value)) {
          errors.push({
            field: field_name,
            message: `${label} phải có định dạng HH:MM`
          });
        }
        break;
    }
  }

  return errors;
};

const getFormSchemaFromService = async (serviceId) => {
  const service = await Service.findByPk(serviceId);
  
  if (!service) {
    throw new Error('Service không tồn tại');
  }

  if (!service.layout_config || !Array.isArray(service.layout_config)) {
    throw new Error('Service chưa cấu hình layout');
  }

  // Tìm booking block trong layout_config
  const bookingBlock = service.layout_config.find(
    block => block.type === 'booking'
  );

  if (!bookingBlock || !bookingBlock.data || !bookingBlock.data.form_schema) {
    throw new Error('Service chưa cấu hình form booking');
  }

  return bookingBlock.data.form_schema;
};

const calculateEndTime = (startTime, durationMinutes) => {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return end;
};

// ============================================
// 2. CONTROLLER FUNCTIONS (Public)
// ============================================

// POST /api/bookings - Tạo booking mới
const createBooking = async (req, res, next) => {
  try {
    const customerId = req.user.userId;
    const { service_id, start_time, location, note, booking_data } = req.body;

    // 1. Validate service exists & active
    const service = await Service.findOne({
      where: {
        id: service_id,
        is_active: true,
        deleted_at: null
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ hoặc dịch vụ không khả dụng'
      });
    }

    // 2. Get form_schema from service
    const formSchema = await getFormSchemaFromService(service_id);

    // 3. Validate dynamic booking_data
    if (!booking_data || typeof booking_data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin booking_data'
      });
    }

    const validationErrors = validateDynamicFormData(formSchema, booking_data);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validationErrors
      });
    }

    // 4. Validate start_time
    const now = new Date();
    const startDate = new Date(start_time);

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian không hợp lệ'
      });
    }

    if (startDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Không thể đặt lịch trong quá khứ'
      });
    }

    // Check max 7 days advance
    const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (startDate > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể đặt lịch trước tối đa 7 ngày'
      });
    }

    // Check working hours (7:00 - 19:00)
    const startHour = startDate.getHours();
    if (startHour < 7 || startHour >= 19) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ làm việc từ 7:00 đến 19:00'
      });
    }

    // 5. Calculate end_time
    const endTime = calculateEndTime(startDate, service.duration_minutes);
    const endHour = endTime.getHours();
    
    if (endHour > 19 || (endHour === 19 && endTime.getMinutes() > 0)) {
      return res.status(400).json({
        success: false,
        message: `Dịch vụ kéo dài ${service.duration_minutes} phút. Thời gian kết thúc không được vượt quá 19:00. Vui lòng chọn giờ bắt đầu sớm hơn.`
      });
    }

    // 6. Create booking
    const booking = await Booking.create({
      customer_id: customerId,
      service_id: service.id,
      start_time: startDate,
      end_time: endTime,
      location,
      note: note || null,
      total_price: service.base_price,
      payment_status: 'UNPAID',
      status: 'PENDING',
      booking_data // ✨ Save dynamic data
    });

    // 7. Return response
    const createdBooking = await Booking.findByPk(booking.id, {
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'duration_minutes', 'base_price']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.',
      data: {
        booking: {
          id: createdBooking.id,
          service: createdBooking.service,
          status: createdBooking.status,
          start_time: createdBooking.start_time,
          end_time: createdBooking.end_time,
          location: createdBooking.location,
          note: createdBooking.note,
          total_price: createdBooking.total_price,
          payment_status: createdBooking.payment_status,
          booking_data: createdBooking.booking_data,
          created_at: createdBooking.created_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/bookings - Lấy danh sách booking của customer
const getMyBookings = async (req, res, next) => {
  try {
    const customerId = req.user.userId;
    const { status } = req.query;

    const whereCondition = {
      customer_id: customerId
    };

    if (status) {
      whereCondition.status = status.toUpperCase();
    }

    const bookings = await Booking.findAll({
      where: whereCondition,
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'duration_minutes']
        },
        {
          model: Cleaner,
          as: 'cleaner',
          attributes: ['id', 'full_name', 'phone'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        bookings: bookings.map(b => ({
          id: b.id,
          service: b.service,
          cleaner: b.cleaner,
          status: b.status,
          start_time: b.start_time,
          end_time: b.end_time,
          location: b.location,
          note: b.note,
          total_price: b.total_price,
          payment_status: b.payment_status,
          booking_data: b.booking_data,
          created_at: b.created_at
        })),
        total: bookings.length
      }
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id - Lấy chi tiết 1 booking
const getBookingDetail = async (req, res, next) => {
  try {
    const customerId = req.user.userId;
    const { id } = req.params;

    const booking = await Booking.findOne({
      where: {
        id,
        customer_id: customerId
      },
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'duration_minutes', 'base_price']
        },
        {
          model: Cleaner,
          as: 'cleaner',
          attributes: ['id', 'full_name', 'phone'],
          required: false
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking'
      });
    }

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          service: booking.service,
          cleaner: booking.cleaner,
          status: booking.status,
          start_time: booking.start_time,
          end_time: booking.end_time,
          location: booking.location,
          note: booking.note,
          total_price: booking.total_price,
          payment_status: booking.payment_status,
          booking_data: booking.booking_data,
          created_at: booking.created_at,
          updated_at: booking.updated_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/cancel - Hủy booking
const cancelBooking = async (req, res, next) => {
  try {
    const customerId = req.user.userId;
    const { id } = req.params;

    // 1. Find booking
    const booking = await Booking.findOne({
      where: {
        id,
        customer_id: customerId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking'
      });
    }

    // 2. Check status
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng có trạng thái ${booking.status}`
      });
    }

    // 3. Check 2-hour rule
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const hoursDiff = (startTime - now) / (1000 * 60 * 60);

    if (hoursDiff < 2) {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể hủy đơn trước 2 giờ. Hiện tại còn ${hoursDiff.toFixed(1)} giờ.`
      });
    }

    // 4. Cancel booking
    booking.status = 'CANCELLED';
    await booking.save();

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công',
      data: {
        booking: {
          id: booking.id,
          status: booking.status,
          start_time: booking.start_time
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// ============================================
// EXPORTS (Bắt buộc để Route nhận diện được)
// ============================================
module.exports = {
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking
};