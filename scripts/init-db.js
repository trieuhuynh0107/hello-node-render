// Import pool kết nối từ file config
const pool = require('../config/db');

// Hàm chính để khởi tạo database
const initDatabase = async () => {
  const client = await pool.connect();
  console.log(`Đã kết nối với database local (${process.env.DATABASE_URL.split('/')[3]})!`);

  try {
    // Bắt đầu một transaction
    await client.query('BEGIN');

    // 1. Xóa các bảng cũ theo thứ tự phụ thuộc (dùng CASCADE)
    console.log('Đang xóa các bảng cũ (nếu có)...');
    await client.query('DROP TABLE IF EXISTS ratings, notifications, bookings, cleaner_profiles, services, users CASCADE;');

    // 2. Tạo bảng 'users'
    console.log('Đang tạo bảng "users"...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK(role IN ('customer', 'cleaner', 'admin')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('active', 'suspended', 'pending')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tạo bảng 'services'
    console.log('Đang tạo bảng "services"...');
    await client.query(`
      CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        base_price DECIMAL(10, 2) NOT NULL,
        price_per_hour DECIMAL(10, 2),
        duration_hours INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Tạo bảng 'cleaner_profiles'
    console.log('Đang tạo bảng "cleaner_profiles"...');
    await client.query(`
      CREATE TABLE cleaner_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        years_experience INTEGER DEFAULT 0,
        average_rating DECIMAL(3, 2) DEFAULT 0.00,
        total_jobs INTEGER DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Tạo bảng 'bookings'
    console.log('Đang tạo bảng "bookings"...');
    await client.query(`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        booking_number VARCHAR(100) UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL REFERENCES users(id),
        cleaner_id INTEGER REFERENCES users(id),
        service_id INTEGER NOT NULL REFERENCES services(id),
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        property_size VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        special_instructions TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'processing', 'paid', 'failed')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Tạo bảng 'ratings'
    console.log('Đang tạo bảng "ratings"...');
    await client.query(`
      CREATE TABLE ratings (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES users(id),
        cleaner_id INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Tạo bảng 'notifications'
    console.log('Đang tạo bảng "notifications"...');
    await client.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Chèn dữ liệu mẫu (Seeding data) cho bảng 'services'
    console.log('Đang chèn dữ liệu mẫu vào "services"...');
    await client.query(`
      INSERT INTO services (name, slug, description, base_price, price_per_hour, duration_hours, is_active) 
      VALUES
      ('Regular Home Cleaning', 'regular-cleaning', 'Dọn dẹp nhà cửa định kỳ theo giờ.', 0.00, 25.00, NULL, true),
      ('Move In/Out Cleaning', 'move-in-out-cleaning', 'Tổng vệ sinh khi chuyển vào hoặc chuyển đi.', 120.00, NULL, 4, true);
    `);

    // Chấp nhận transaction
    await client.query('COMMIT');
    console.log('\n✅ Khởi tạo database thành công! 6 bảng đã được tạo và chèn dữ liệu mẫu.');

  } catch (error) {
    // Hoàn tác lại tất cả thay đổi nếu có lỗi
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi khởi tạo database:', error);
  } finally {
    // Luôn luôn giải phóng client và đóng pool (vì đây là script)
    client.release();
    await pool.end();
    console.log('Đã ngắt kết nối database.');
  }
};

// Chạy hàm khởi tạo
initDatabase();