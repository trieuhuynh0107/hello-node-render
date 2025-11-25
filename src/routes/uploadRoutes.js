const express = require('express');
const router = express.Router();

const authenticate = require('../middlewares/auth');
const adminOnly = require('../middlewares/adminOnly');
const uploadController = require('../controllers/uploadController');
const { getUploadMiddleware } = require('../services/uploadService');

// Chỉ Admin mới được upload
router.use(authenticate);
router.use(adminOnly);

// Get upload middleware (local hoặc cloudinary)
const upload = getUploadMiddleware();

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image
 * @access  Admin only
 * @body    FormData with field name "image"
 */
router.post(
  '/image',
  upload.single('image'),
  uploadController.uploadImage
);

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images (max 10)
 * @access  Admin only
 * @body    FormData with field name "images"
 */
router.post(
  '/images',
  upload.array('images', 10),
  uploadController.uploadMultipleImages
);

module.exports = router;