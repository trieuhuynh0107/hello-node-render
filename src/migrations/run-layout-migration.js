require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse connection config
let clientConfig;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  clientConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password)
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

async function runMigration() {
  try {
    await client.connect();
    console.log('🔄 Connected to PostgreSQL. Running layout migration...\n');

    // Đọc file SQL
    const sqlPath = path.join(__dirname, './003_add_layout_config.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Added:');
    console.log('   - Column: services.layout_config (JSONB)');
    console.log('   - Index: idx_services_layout_config');
    console.log('   - Default layouts for existing services');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();