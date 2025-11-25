require('dotenv').config();
const express = require('express');
const cors = require('cors');

const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes')

const app = express();

// ============================================
// MIDDLEWARES
// ============================================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Public service routes
app.use('/api/services', serviceRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// ============================================
// ERROR HANDLER (phải để cuối cùng)
// ============================================
app.use(errorHandler);

module.exports = app;