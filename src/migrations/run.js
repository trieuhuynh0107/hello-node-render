require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse connection string
let clientConfig;

if (process.env.DATABASE_URL) {
  // Parse URL manually để tránh lỗi password encoding
  try {
    const url = new URL(process.env.DATABASE_URL);
    clientConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Bỏ dấu "/" đầu
      user: url.username,
      password: decodeURIComponent(url.password) // Decode password
    };
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format');
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

const client = new Client(clientConfig);

async function runMigrations() {
  try {
    await client.connect();
    console.log('🔄 Connected to PostgreSQL. Running migrations...\n');

    // Đọc file SQL
    const sqlPath = path.join(__dirname, '001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('   - users (with admin@cleaningservice.com / password: admin123)');
    console.log('   - services (with 3 sample services)');
    console.log('   - cleaners');
    console.log('   - bookings');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();