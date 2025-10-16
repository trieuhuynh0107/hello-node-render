// Import pool kết nối từ file config
const pool = require('../config/db');

const initDatabase = async () => {
  // Lấy một client từ pool để thực hiện nhiều câu lệnh
  const client = await pool.connect();
  console.log('Connected to the database!');

  try {
    // Bắt đầu một transaction để đảm bảo tất cả các lệnh đều thành công
    await client.query('BEGIN');

    // 1. Xóa bảng cũ đi nếu nó đã tồn tại để tránh lỗi
    console.log('Dropping existing "services" table...');
    await client.query('DROP TABLE IF EXISTS services');

    // 2. Tạo bảng services mới với các cột cần thiết
    console.log('Creating "services" table...');
    const createTableQuery = `
      CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        features TEXT[],
        pricing JSONB
      );
    `;
    await client.query(createTableQuery);
    console.log('Table "services" created successfully.');

    // 3. Chèn dữ liệu ban đầu vào bảng
    console.log('Inserting initial data...');
    const insertDataQuery = `
      INSERT INTO services (id, service_name, description, image_url, features, pricing) VALUES
      (1, 'Dọn dẹp nhà cửa', 'Dịch vụ dọn dẹp nhà cửa chuyên nghiệp, giúp bạn có thêm thời gian thảnh thơi bên gia đình.', 'https://placehold.co/600x400/a7c957/white?text=Dọn+Nhà', ARRAY['Lau dọn sàn nhà, cửa kính', 'Vệ sinh khu vực bếp, nhà vệ sinh'], '{"basePrice": "50,000đ/giờ", "note": "Giá có thể thay đổi."}'),
      (2, 'Chuyển nhà trọn gói', 'Dịch vụ chuyển nhà nhanh chóng, an toàn và tiết kiệm. Chúng tôi lo tất cả, bạn chỉ việc an tâm.', 'https://placehold.co/600x400/386641/white?text=Chuyển+Nhà', ARRAY['Phân loại & đóng gói đồ đạc', 'Vận chuyển bằng xe tải chuyên dụng'], '{"basePrice": "500,000đ/chuyến", "note": "Giá tùy thuộc vào khối lượng đồ."}');
    `;
    await client.query(insertDataQuery);
    console.log('Initial data inserted successfully.');

    // Chấp nhận transaction nếu mọi thứ thành công
    await client.query('COMMIT');

    console.log('\n✅ Database initialization complete!');

  } catch (error) {
    // Hoàn tác lại tất cả thay đổi nếu có lỗi xảy ra
    await client.query('ROLLBACK');
    console.error('❌ Error during database initialization:', error);
  } finally {
    // Luôn luôn giải phóng client và đóng pool kết nối sau khi script chạy xong
    client.release();
    pool.end();
  }
};

// Chạy hàm khởi tạo
initDatabase();
