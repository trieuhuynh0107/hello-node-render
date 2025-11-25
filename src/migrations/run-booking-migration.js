// File: src/migrations/run-booking-migration.js

const path = require('path');
const fs = require('fs');
// Load biến môi trường từ file .env ở thư mục gốc
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { Client } = require('pg');

// 1. Cấu hình kết nối (Sử dụng logic của bạn)
let clientConfig;

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    clientConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Bỏ dấu / đầu tiên
      user: url.username,
      password: decodeURIComponent(url.password) // Decode password để tránh lỗi ký tự đặc biệt
    };
  } catch (err) {
    console.error('❌ Error parsing DATABASE_URL:', err.message);
    process.exit(1);
  }
} else {
  clientConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };
}

// Thêm cấu hình SSL (Bắt buộc cho Render/Heroku/Neon/Supabase)
if (process.env.DB_SSL === 'true') {
  clientConfig.ssl = { rejectUnauthorized: false };
}

console.log('🔌 Connecting to database:', clientConfig.host);

// Khởi tạo Client
const client = new Client(clientConfig);

async function runMigration() {
  try {
    // Kết nối
    await client.connect();
    
    console.log('🔄 Running booking_data migration...\n');
    
    // Đường dẫn file SQL (cùng thư mục với script này)
    const sqlPath = path.join(__dirname, '004_add_booking_data.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`File SQL không tồn tại tại: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Thực thi SQL
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify lại cột vừa tạo
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'booking_data'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: booking_data column exists');
      console.log('   Type:', result.rows[0].data_type);
    } else {
      console.warn('⚠️ Warning: Không tìm thấy cột booking_data sau khi chạy.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    // Đóng kết nối
    await client.end();
  }
}

runMigration();