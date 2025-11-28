// src/services/bookingService.js
const { Booking, Service, Cleaner, User } = require('../models');
const { Op } = require('sequelize');
const { 
    generateLocationSummary, 
    calculateEndTime, 
    calculateFinalPrice, 
    validateDynamicFormData 
} = require('../utils/bookingHelper');

// ==========================================
// 1. LOGIC TẠO ĐƠN (CREATE)
// ==========================================
const createBookingCore = async (customerId, data) => {
    const { service_id, note, booking_data } = data;

    // A. Lấy thông tin Service
    const service = await Service.findOne({ where: { id: service_id, is_active: true } });
    if (!service) throw new Error('SERVICE_NOT_FOUND');

    // B. Validate Form Data (Vẫn validate đầy đủ bao gồm cả ngày/giờ)
    const bookingBlock = service.layout_config?.find(block => block.type === 'booking');
    const formSchema = bookingBlock?.data?.form_schema;
    
    const errors = validateDynamicFormData(formSchema, booking_data);
    if (errors.length > 0) {
        const err = new Error('VALIDATION_ERROR');
        err.details = errors;
        throw err;
    }

    // C. Xử lý thời gian
    if (!booking_data.booking_date || !booking_data.booking_time) {
        throw new Error('MISSING_TIME');
    }
    const timeString = `${booking_data.booking_date}T${booking_data.booking_time}:00+07:00`;
    const startDate = new Date(timeString);
    if (isNaN(startDate.getTime())) throw new Error('INVALID_TIME_FORMAT');

    // D. Tính toán các thông số còn lại
    const endTime = calculateEndTime(startDate, service.duration_minutes);
    const finalPrice = calculateFinalPrice(service, booking_data);
    const locationDisplay = generateLocationSummary(booking_data);

    const dataToSave = { ...booking_data };
    delete dataToSave.booking_date;
    delete dataToSave.booking_time;

    // E. Lưu DB
    const booking = await Booking.create({
        customer_id: customerId,
        service_id: service.id,
        start_time: startDate,
        end_time: endTime,
        location: locationDisplay,
        note: note || null,
        total_price: finalPrice,
        booking_data: dataToSave // Lưu object đã được làm sạch
    });

    return booking;
};
// ==========================================
// 2. LOGIC CHECK TRÙNG LỊCH (CHECK AVAILABILITY)
// ==========================================
const checkCleanerAvailability = async (cleanerId, startTime, endTime) => {
    const BUFFER_MS = 30 * 60 * 1000; // 30 phút
    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflictBooking = await Booking.findOne({
        where: {
            cleaner_id: cleanerId,
            status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
            [Op.and]: [
                {
                    start_time: { [Op.lt]: new Date(end.getTime() + BUFFER_MS) },
                    end_time: { [Op.gt]: new Date(start.getTime() - BUFFER_MS) }
                }
            ]
        }
    });

    return !conflictBooking;
};

// ==========================================
// 3. LOGIC GÁN NHÂN VIÊN (ASSIGN)
// ==========================================
const assignCleanerCore = async (bookingId, cleanerId) => {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        throw new Error('INVALID_STATUS');
    }

    const cleaner = await Cleaner.findByPk(cleanerId);
    if (!cleaner || cleaner.status !== 'ACTIVE') throw new Error('CLEANER_UNAVAILABLE');

    // Check trùng lịch
    const isFree = await checkCleanerAvailability(cleanerId, booking.start_time, booking.end_time);
    if (!isFree) throw new Error('CONFLICT_SCHEDULE');

    // Update
    booking.cleaner_id = cleanerId;
    booking.status = 'CONFIRMED';
    await booking.save();

    return { booking, cleaner };
};

// ==========================================
// 4. LOGIC LẤY DANH SÁCH (GET LIST)
// ==========================================
const getAllBookingsCore = async (filter) => {
    const { page = 1, limit = 10, status, date, search } = filter;
    const offset = (page - 1) * limit;
    const whereCondition = {};

    if (status) whereCondition.status = status.toUpperCase();
    if (date) {
        const start = new Date(`${date}T00:00:00+07:00`);
        const end = new Date(`${date}T23:59:59+07:00`);
        whereCondition.start_time = { [Op.between]: [start, end] };
    }
    if (search) {
        whereCondition[Op.or] = [
            { id: isNaN(search) ? null : search },
            { note: { [Op.iLike]: `%${search}%` } },
            { location: { [Op.iLike]: `%${search}%` } }
        ];
    }

    return await Booking.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
            { model: User, as: 'customer', attributes: ['id', 'full_name', 'phone'] },
            { model: Service, as: 'service', attributes: ['name'] },
            { model: Cleaner, as: 'cleaner', attributes: ['id','name', 'phone'] }
        ],
        distinct: true
    });
};

module.exports = {
    createBookingCore,
    checkCleanerAvailability,
    assignCleanerCore,
    getAllBookingsCore
};