require('dotenv').config();

const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Khởi động server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start Express server
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('=================================');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();