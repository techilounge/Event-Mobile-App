const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  uploadImage,
  uploadDocument,
  uploadMultipleImages,
  uploadImageOrDocument,
  handleUploadError,
  validateUploadedFile,
  getFileUrl,
} = require('../middleware/fileUpload');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   POST /api/uploads/image
 * @desc    Upload a single image
 * @access  Private
 */
router.post(
  '/image',
  authenticateToken,
  uploadLimiter,
  uploadImage.single('image'),
  handleUploadError,
  validateUploadedFile,
  (req, res) => {
    try {
      const fileUrl = getFileUrl(req, req.file.path);
      
      res.status(201).json({
        message: 'Image uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          path: req.file.path,
        },
      });
    } catch (error) {
      console.error('Error handling image upload:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process image upload.',
      });
    }
  }
);

/**
 * @route   POST /api/uploads/images
 * @desc    Upload multiple images
 * @access  Private
 */
router.post(
  '/images',
  authenticateToken,
  uploadLimiter,
  uploadMultipleImages.array('images', 10),
  handleUploadError,
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          message: 'Please upload at least one image.',
        });
      }

      const files = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: getFileUrl(req, file.path),
        path: file.path,
      }));

      res.status(201).json({
        message: 'Images uploaded successfully',
        count: files.length,
        files: files,
      });
    } catch (error) {
      console.error('Error handling multiple image uploads:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process image uploads.',
      });
    }
  }
);

/**
 * @route   POST /api/uploads/document
 * @desc    Upload a document
 * @access  Private
 */
router.post(
  '/document',
  authenticateToken,
  uploadLimiter,
  uploadDocument.single('document'),
  handleUploadError,
  validateUploadedFile,
  (req, res) => {
    try {
      const fileUrl = getFileUrl(req, req.file.path);
      
      res.status(201).json({
        message: 'Document uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          path: req.file.path,
        },
      });
    } catch (error) {
      console.error('Error handling document upload:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process document upload.',
      });
    }
  }
);

/**
 * @route   POST /api/uploads/file
 * @desc    Upload an image or document
 * @access  Private
 */
router.post(
  '/file',
  authenticateToken,
  uploadLimiter,
  uploadImageOrDocument.single('file'),
  handleUploadError,
  validateUploadedFile,
  (req, res) => {
    try {
      const fileUrl = getFileUrl(req, req.file.path);
      
      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          path: req.file.path,
        },
      });
    } catch (error) {
      console.error('Error handling file upload:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process file upload.',
      });
    }
  }
);

/**
 * @route   DELETE /api/uploads/:filename
 * @desc    Delete an uploaded file
 * @access  Private (Organizer only)
 */
router.delete(
  '/:filename',
  authenticateToken,
  requireRole('organizer'),
  (req, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../uploads');
      
      // Security: Prevent directory traversal
      const filename = path.basename(req.params.filename);
      const filePath = path.join(uploadsDir, filename);
      
      // Ensure the file is within the uploads directory
      if (!filePath.startsWith(uploadsDir)) {
        return res.status(400).json({
          error: 'Invalid file path',
          message: 'Invalid file path.',
        });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File not found',
          message: 'The requested file does not exist.',
        });
      }

      fs.unlinkSync(filePath);
      
      res.json({
        message: 'File deleted successfully',
        filename: filename,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete file.',
      });
    }
  }
);

module.exports = router;

