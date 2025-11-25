const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Cloudinary Storage Engine
 */
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cleaning-service', // Thư mục trên Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' } // Auto resize
    ]
  }
});

/**
 * Upload Instance for Cloudinary
 */
const uploadCloudinary = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Delete image from Cloudinary
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadCloudinary,
  deleteImage
};