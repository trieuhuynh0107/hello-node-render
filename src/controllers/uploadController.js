const { getFileUrl } = require('../services/uploadService');

/**
 * POST /api/upload/image
 * Upload single image
 * Dành cho Admin upload ảnh khi build page
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được upload'
      });
    }

    const fileUrl = getFileUrl(req.file);

    res.json({
      success: true,
      message: 'Upload ảnh thành công',
      data: {
        url: fileUrl,
        filename: req.file.filename || req.file.public_id,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/images
 * Upload multiple images
 * Max 10 images per request
 */
const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được upload'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      url: getFileUrl(file),
      filename: file.filename || file.public_id,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: `Upload ${uploadedFiles.length} ảnh thành công`,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages
};