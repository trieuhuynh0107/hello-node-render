require('dotenv').config();
const { Sequelize } = require('sequelize');

// Kiểm tra môi trường
const isProduction = process.env.NODE_ENV === 'production';

// Khởi tạo Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    timezone: '+07:00',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // 🔥 SỬA: Thêm cấu hình SSL cho Render
    dialectOptions: isProduction ? {
      ssl: {
        require: true, // Bắt buộc dùng SSL
        rejectUnauthorized: false // Chấp nhận chứng chỉ của Render (Self-signed)
      }
    } : {}, // Ở Local thì để object rỗng (không SSL)

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };