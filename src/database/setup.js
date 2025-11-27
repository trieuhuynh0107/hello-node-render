const path = require('path');
// Load biến môi trường và lưu kết quả vào biến envConfig
const envConfig = require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const { Client } = require('pg');

// --- DEBUG BLOCK: Kiểm tra xem có đọc được .env không ---
if (envConfig.error) {
    console.error("⚠️  CẢNH BÁO: Không tìm thấy file .env hoặc lỗi khi đọc file.");
} else {
    console.log("✅ Đã load file .env thành công.");
}

// Kiểm tra xem biến DB_PASSWORD có tồn tại không (Không in ra giá trị thật để bảo mật)
if (!process.env.DB_PASSWORD && !process.env.DATABASE_URL) {
    console.error("❌ LỖI: Biến DB_PASSWORD hoặc DATABASE_URL đang bị TRỐNG (undefined).");
    console.error("👉 Hãy kiểm tra lại file .env của bạn.");
    process.exit(1); // Dừng chương trình
}
// -------------------------------------------------------

// Kiểm tra xem có đang chạy mode production (kết nối Neon/Render) không
const isProduction = process.env.NODE_ENV === 'production';

let clientConfig;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  clientConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password),
    // 🔥 FIX: Bắt buộc SSL nếu là production (Neon/Render)
    ssl: isProduction ? { rejectUnauthorized: false } : false
  };
} else {
  clientConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    // 🔥 FIX QUAN TRỌNG: Thêm || '' để đảm bảo luôn là string, tránh lỗi SASL crash
    password: process.env.DB_PASSWORD || '', 
    // 🔥 FIX: Bắt buộc SSL nếu là production (Neon/Render)
    ssl: isProduction ? { rejectUnauthorized: false } : false
  };
}

console.log(`🛠️  Configuring database connection to: ${clientConfig.host}`);
console.log(`🔐 SSL Mode: ${clientConfig.ssl ? 'ENABLED' : 'DISABLED'}`);

const client = new Client(clientConfig);

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to Database...');
    await client.connect();

    console.log('🗑️  Resetting & Seeding Database...');
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);

    console.log('✅ Database setup completed successfully!');
    console.log('   - Tables created: users, services, cleaners, bookings');
    console.log('   - Data seeded: Admin user, Cleaning Service, Moving Service');

  } catch (err) {
    console.error('❌ Error setup database:', err.message); // In message cho gọn
  } finally {
    await client.end();
  }
}

setupDatabase();