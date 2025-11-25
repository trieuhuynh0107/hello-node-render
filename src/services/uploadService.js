const upload = require('../config/upload'); // Local storage
const { uploadCloudinary } = require('../config/cloudinary'); // Cloud storage

/**
 * Chọn upload method dựa trên env
 */
const getUploadMiddleware = () => {
  const storageType = process.env.UPLOAD_STORAGE || 'local';
  
  if (storageType === 'cloudinary') {
    return uploadCloudinary;
  }
  
  return upload; // Default: local
};

/**
 * Format response URL
 * Local: /uploads/filename.jpg
 * Cloudinary: https://res.cloudinary.com/...
 */
const getFileUrl = (file) => {
  const storageType = process.env.UPLOAD_STORAGE || 'local';
  
  if (storageType === 'cloudinary') {
    return file.path; // Cloudinary trả về full URL
  }
  
  // Local: Trả về relative path
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${file.filename}`;
};

module.exports = {
  getUploadMiddleware,
  getFileUrl
};