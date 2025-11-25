const { Booking, Service, Cleaner } = require('../models');
const { Op } = require('sequelize');

// ============================================
// 1. HELPER FUNCTIONS (Private)
// ============================================

const validateDynamicFormData = (formSchema, bookingData) => {
  const errors = [];
  // ... (Giữ nguyên logic validate cũ của bạn ở đây) ...
  for (const field of formSchema) {
    const { field_name, field_type, label, required, validation } = field;
    const value = bookingData[field_name];

    if (required && (value === undefined || value === null || value === '')) {
      errors.push({ field: field_name, message: `${label} là bắt buộc` });
      continue;
    }
    if (!value && !required) continue;

    switch (field_type) {
      case 'number':
        if (isNaN(value)) errors.push({ field: field_name, message: `${label} phải là số` });
        // Add min/max check if needed
        break;
      case 'text':
      case 'textarea':
      case 'select':
         // Basic checks
        break;
        // ... (Các case khác giữ nguyên)
    }
  }
  return errors;
};

// 👇👇👇 HÀM MỚI: TÍNH GIÁ ĐỘNG 👇👇👇
const calculateFinalPrice = (service, bookingData) => {
  let finalPrice = Number(service.base_price);

  // Kiểm tra xem layout_config có phải mảng không
  if (!Array.isArray(service.layout_config)) return finalPrice;

  // 1. Tìm block Pricing
  const pricingBlock = service.layout_config.find(block => block.type === 'pricing');

  // 2. Nếu có Pricing Block và user có chọn subservice_id
  if (pricingBlock && pricingBlock.data && pricingBlock.data.subservices && bookingData.subservice_id) {
    
    // Tìm gói user chọn trong danh sách subservices
    const selectedPackage = pricingBlock.data.subservices.find(
      pkg => pkg.id === bookingData.subservice_id
    );

    // Nếu tìm thấy, lấy giá của gói đó
    if (selectedPackage) {
      finalPrice = Number(selectedPackage.price);
    }
  }

  // 3. Logic mở rộng cho Moving (Chuyển nhà) nếu cần
  // Ví dụ: Mapping truck_type sang giá tiền... (Có thể làm sau)

  return finalPrice;
};
// 👆👆👆 ----------------------- 👆👆👆

const getFormSchemaFromService = async (serviceId) => {
  const service = await Service.findByPk(serviceId);
  if (!service) throw new Error('Service không tồn tại');
  
  const bookingBlock = service.layout_config?.find(block => block.type === 'booking');
  if (!bookingBlock?.data?.form_schema) throw new Error('Service chưa cấu hình form booking');

  return bookingBlock.data.form_schema;
};

const calculateEndTime = (startTime, durationMinutes) => {
  const start = new Date(startTime);
  return new Date(start.getTime() + durationMinutes * 60000);
};

// ============================================
// 2. CONTROLLER FUNCTIONS (Public)
// ============================================

// POST /api/bookings - Tạo booking mới
const createBooking = async (req, res, next) => {
  try {
    // ⚠️ Fix lỗi req.user undefined (Lấy id hoặc userId)
    const customerId = req.user.id || req.user.userId;
    const { service_id, start_time, location, note, booking_data } = req.body;

    // 1. Validate service exists & active
    const service = await Service.findOne({
      where: { id: service_id, is_active: true }
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Dịch vụ không tồn tại' });
    }

    // 2. Validate Form Schema & Data
    const formSchema = await getFormSchemaFromService(service_id);
    if (!booking_data) return res.status(400).json({ success: false, message: 'Thiếu booking_data' });

    const validationErrors = validateDynamicFormData(formSchema, booking_data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: validationErrors });
    }

    // 3. Validate Time Logic
    const startDate = new Date(start_time);
    const now = new Date();
    // ... (Giữ nguyên logic check ngày giờ 7h-19h của bạn) ...
    
    const endTime = calculateEndTime(startDate, service.duration_minutes);

    // 👇👇👇 TÍNH GIÁ TIỀN CHÍNH XÁC 👇👇👇
    const finalPrice = calculateFinalPrice(service, booking_data);
    // 👆👆👆 ----------------------- 👆👆👆

    // 4. Create booking
    const booking = await Booking.create({
      customer_id: customerId,
      service_id: service.id,
      start_time: startDate,
      end_time: endTime,
      location,
      note: note || null,
      total_price: finalPrice, // ✅ Dùng giá đã tính toán
      payment_status: 'UNPAID',
      status: 'PENDING',
      booking_data
    });

    // 5. Return response
    const createdBooking = await Booking.findByPk(booking.id, {
      include: [{ model: Service, as: 'service', attributes: ['id', 'name', 'base_price'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công!',
      data: {
        booking: {
          id: createdBooking.id,
          service: createdBooking.service,
          status: createdBooking.status,
          start_time: createdBooking.start_time,
          end_time: createdBooking.end_time,
          location: createdBooking.location,
          total_price: createdBooking.total_price, // Sẽ trả về giá đúng (VD: 400000)
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

// ... (Các hàm getMyBookings, getBookingDetail... Giữ nguyên) ...
const getMyBookings = async (req, res, next) => {
    // Copy lại logic cũ
    try {
        const customerId = req.user.id || req.user.userId;
        const { status } = req.query;
        const whereCondition = { customer_id: customerId };
        if (status) whereCondition.status = status.toUpperCase();

        const bookings = await Booking.findAll({
            where: whereCondition,
            include: [
                { model: Service, as: 'service' },
                { model: Cleaner, as: 'cleaner', required: false }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({ success: true, data: { bookings, total: bookings.length } });
    } catch (error) { next(error); }
};

const getBookingDetail = async (req, res, next) => {
     // Copy lại logic cũ
     try {
        const customerId = req.user.id || req.user.userId;
        const { id } = req.params;
        const booking = await Booking.findOne({
            where: { id, customer_id: customerId },
            include: [{ model: Service, as: 'service' }, { model: Cleaner, as: 'cleaner' }]
        });
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, data: { booking } });
     } catch (error) { next(error); }
};

const cancelBooking = async (req, res, next) => {
    // Copy lại logic cũ
    try {
        const customerId = req.user.id || req.user.userId;
        const { id } = req.params;
        const booking = await Booking.findOne({ where: { id, customer_id: customerId } });
        if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
        
        booking.status = 'CANCELLED';
        await booking.save();
        res.json({ success: true, message: 'Cancelled' });
    } catch (error) { next(error); }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking
};