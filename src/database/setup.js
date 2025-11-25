const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const { Client } = require('pg');

let clientConfig;
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  clientConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
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
    console.error('❌ Error setup database:', err);
  } finally {
    await client.end();
  }
}

setupDatabase();