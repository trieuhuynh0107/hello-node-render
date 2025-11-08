const express = require('express');
const router = express.Router();

// Import controller
const authController = require('../controllers/authController');
//import middleware 
const { authenticateToken } = require('../middleware/authMiddleware');

// Định nghĩa route 
router.post('/register', authController.register);

router.post('/login', authController.login);

//route được bảo vệ bởi middleware
router.get('/me', authenticateToken, authController.getMe);

// Xuất router này ra để file khác có thể dùng
module.exports = router;