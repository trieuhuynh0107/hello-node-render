const pool = require('../src/config/db');
const { calculatePrice } = require('../utils/priceCalculator');

// --- HÀM NỘI BỘ (HELPER FUNCTION) ---


const generateBookingNumber = async () => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, ''); 
  
  const result = await pool.query(
    "SELECT COUNT(id) FROM bookings WHERE created_at >= CURRENT_DATE"
  );
  const count = parseInt(result.rows[0].count, 10) + 1; 
  const sequentialNumber = count.toString().padStart(3, '0'); 

  return `BK-${date}-${sequentialNumber}`;
};

const createNotification = async (client, userId, title, message, type) => {
  const query = `
    INSERT INTO notifications (user_id, title, message, type)
    VALUES ($1, $2, $3, $4)
  `;
  // Lưu ý: chúng ta dùng 'client' (từ transaction) để đảm bảo
  // thông báo chỉ được tạo nếu toàn bộ đơn hàng thành công.
  await client.query(query, [userId, title, message, type]);
};


// --- HÀM API CHÍNH ---

/**
 * API #6: Tạo một đơn hàng mới (POST /api/bookings)
 * (Logic theo Mục 12.1)
 */
const createBooking = async (req, res) => {
  // Bắt đầu một transaction
  const client = await pool.connect();

  try {
    // 1. Validate input (Rule 8.2) - Chúng ta sẽ làm validation kỹ hơn sau
    const { service_id, booking_date, booking_time, property_size, address, special_instructions } = req.body;
    if (!service_id || !booking_date || !booking_time || !property_size || !address) {
      return res.status(400).json({
        success: false,
        error: { code: "VAL_001", message: "Vui lòng điền đầy đủ thông tin bắt buộc." }
      });
    }

    // 2. Lấy Customer ID từ "người bảo vệ" (req.user)
    const customer_id = req.user.id;

    // 3. Verify service_id và lấy thông tin service
    const serviceResult = await client.query('SELECT * FROM services WHERE id = $1 AND is_active = true', [service_id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "RES_001", message: "Dịch vụ không tồn tại hoặc không hoạt động." }
      });
    }
    const service = serviceResult.rows[0];

    // 4. Tính giá (Price Calculation) - (Rule 9)
    const { total } = calculatePrice(service, property_size);
    const total_amount = total;

    // 5. Tạo Booking Number (Rule 6)
    const booking_number = await generateBookingNumber();

    // Bắt đầu TRANSACTION
    await client.query('BEGIN');

    // 6. Tạo đơn hàng (INSERT vào 'bookings')
    const bookingQuery = `
      INSERT INTO bookings (
        booking_number, customer_id, service_id, booking_date, 
        booking_time, property_size, address, special_instructions,
        status, total_amount, payment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *; 
    `;
    const bookingParams = [
      booking_number, customer_id, service_id, booking_date,
      booking_time, property_size, address, special_instructions,
      'pending', // status (Rule 6)
      total_amount, 
      'pending' // payment_status (Rule 6)
    ];
    
    const newBookingResult = await client.query(bookingQuery, bookingParams);
    const newBooking = newBookingResult.rows[0];

    // 7. Tạo thông báo cho khách hàng (Rule 10.1)
    await createNotification(
      client,
      customer_id,
      "Đã tạo đơn hàng",
      `Đơn hàng #${newBooking.booking_number} của bạn đã được tạo và đang chờ người thực hiện.`,
      "booking"
    );

    // 8. COMMIT TRANSACTION
    await client.query('COMMIT');

    // 9. Trả về 201 Created
    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công.",
      data: newBooking
    });

  } catch (error) {
    // Nếu có bất kỳ lỗi nào, ROLLBACK transaction
    await client.query('ROLLBACK');
    console.error('Lỗi khi tạo đơn hàng:', error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi máy chủ nội bộ." }
    });
  } finally {
    // Luôn luôn giải phóng client về pool
    client.release();
  }
};

// Xuất các hàm
module.exports = {
  createBooking,
  // (Chúng ta sẽ thêm các hàm GET /bookings, GET /bookings/:id... vào đây sau)
};