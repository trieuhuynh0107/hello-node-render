const { Booking, Service, Cleaner } = require('../models');
const { Op } = require('sequelize');

// ============================================
// 1. HELPER FUNCTIONS (Private)
// ============================================

const validateDynamicFormData = (formSchema, bookingData) => {
  const errors = [];
  for (const field of formSchema) {
    const { field_name, field_type, label, required } = field;
    const value = bookingData[field_name];

    if (required && (value === undefined || value === null || value === '')) {
      errors.push({ field: field_name, message: `${label} là bắt buộc` });
      continue;
    }
    if (!value && !required) continue;

    if (field_type === 'number' && isNaN(value)) {
        errors.push({ field: field_name, message: `${label} phải là số` });
    }
  }
  return errors;
};

const calculateFinalPrice = (service, bookingData) => {
  let finalPrice = Number(service.base_price);
  if (!Array.isArray(service.layout_config)) return finalPrice;

  const pricingBlock = service.layout_config.find(block => block.type === 'pricing');
  if (pricingBlock?.data?.subservices && bookingData.subservice_id) {
    const selectedPackage = pricingBlock.data.subservices.find(
      pkg => pkg.id === bookingData.subservice_id
    );
    if (selectedPackage) finalPrice = Number(selectedPackage.price);
  }
  return finalPrice;
};

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

// Hàm mới: Tự động trích xuất địa chỉ hiển thị từ JSON
const generateLocationSummary = (bookingData) => {
    // 1. Trường hợp Chuyển nhà (Có điểm đi & đến)
    if (bookingData.from_address && bookingData.to_address) {
        return `${bookingData.from_address} ➝ ${bookingData.to_address}`;
    }
    // 2. Trường hợp Dọn nhà (Ưu tiên address -> location -> from_address)
    if (bookingData.address) return bookingData.address;
    if (bookingData.location) return bookingData.location;
    if (bookingData.from_address) return bookingData.from_address;
    
    return 'Chưa cập nhật địa chỉ';
};

// ============================================
// 2. CONTROLLER FUNCTIONS (Public)
// ============================================

// POST /api/bookings - Tạo booking mới
const createBooking = async (req, res, next) => {
  try {
    const customerId = req.user.id || req.user.userId;
    // Bỏ 'location' ở đây vì ta sẽ tự tính
    const { service_id, note, booking_data } = req.body;

    // 1. Validate service
    const service = await Service.findOne({
      where: { id: service_id, is_active: true }
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Dịch vụ không tồn tại' });
    }

    // 2. Validate Form Schema
    const formSchema = await getFormSchemaFromService(service_id);
    if (!booking_data) return res.status(400).json({ success: false, message: 'Thiếu booking_data' });

    const validationErrors = validateDynamicFormData(formSchema, booking_data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: validationErrors });
    }

    // 3. XỬ LÝ THỜI GIAN
    if (!booking_data.booking_date || !booking_data.booking_time) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin ngày giờ trong booking_data' });
    }

    // Ép kiểu giờ VN (+07:00)
    const timeString = `${booking_data.booking_date}T${booking_data.booking_time}:00+07:00`;
    const startDate = new Date(timeString);
    
    // Lưu ý: Logic check Buffer Time và Work Hour đã được thực hiện ở Validator Middleware, 
    // ở đây ta chỉ parse date để lưu vào DB.

    const endTime = calculateEndTime(startDate, service.duration_minutes);
    const finalPrice = calculateFinalPrice(service, booking_data);
    
    // 4. Xử lý địa chỉ hiển thị (Auto Mapping)
    const mainAddress = generateLocationSummary(booking_data);

    // 5. Create booking
    const booking = await Booking.create({
      customer_id: customerId,
      service_id: service.id,
      start_time: startDate,
      end_time: endTime,
      location: mainAddress, // ✅ Tự động lưu chuỗi địa chỉ tóm tắt
      note: note || null,
      total_price: finalPrice,
      payment_status: 'UNPAID',
      status: 'PENDING',
      booking_data
    });

    // 6. Return response
    const createdBooking = await Booking.findByPk(booking.id, {
      include: [{ model: Service, as: 'service', attributes: ['id', 'name', 'base_price'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công!',
      data: {
        booking: {
          ...createdBooking.toJSON(),
          total_price: createdBooking.total_price
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
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
    try {
        const customerId = req.user.id || req.user.userId;
        const { id } = req.params;

        const booking = await Booking.findOne({ 
            where: { id, customer_id: customerId } 
        });

        if (!booking) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });

        // Check status chặn hủy
        if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(booking.status)) {
             return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng này.' });
        }

        // Check thời gian hủy (Business Rule: 2 tiếng trước khi làm)
        const CANCEL_HOURS_BEFORE = parseInt(process.env.CANCEL_HOURS_BEFORE || 2);
        const timeDiff = new Date(booking.start_time) - new Date(); 
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < CANCEL_HOURS_BEFORE) {
             return res.status(400).json({ 
                 success: false, 
                 message: `Chỉ được hủy đơn hàng trước ${CANCEL_HOURS_BEFORE} tiếng. Vui lòng liên hệ CSKH.` 
             });
        }

        // Cập nhật trạng thái và lý do
        booking.status = 'CANCELLED';
        
        // ✅ Cập nhật trường cancel_reason mới (tách biệt với note)
        if (req.body.cancel_reason) {
            booking.cancel_reason = req.body.cancel_reason; 
        }

        await booking.save();
        res.json({ success: true, message: 'Hủy lịch thành công!' });

    } catch (error) { next(error); }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking
};