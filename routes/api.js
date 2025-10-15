// routes/api.js - Định nghĩa các URL (endpoints) của API

const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Định nghĩa route GET /api/services
// Khi có request đến URL này, hàm getServices sẽ được gọi
router.get('/services', serviceController.getServices);

// Định nghĩa route GET /api/services/:id
// Khi có request đến URL này, hàm getServiceById sẽ được gọi
// :id là một tham số động, có thể là 1, 2, 3...
router.get('/services/:id', serviceController.getServiceById);

// Xuất router để có thể sử dụng ở file server.js
module.exports = router;
