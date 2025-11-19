const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    // Organize files by type
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      uploadPath = path.join(uploadsDir, 'images');
    } else if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      uploadPath = path.join(uploadsDir, 'documents');
    } else {
      uploadPath = path.join(uploadsDir, 'others');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter for images
 */
const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${ALLOWED_IMAGE_TYPES.join(', ')} are allowed for images.`), false);
  }
};

/**
 * File filter for documents
 */
const documentFilter = (req, file, cb) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${ALLOWED_DOCUMENT_TYPES.join(', ')} are allowed for documents.`), false);
  }
};

/**
 * File filter for both images and documents
 */
const imageOrDocumentFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only images and documents are allowed.`), false);
  }
};

/**
 * Multer configuration for image uploads
 */
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1, // Single file
  },
});

/**
 * Multer configuration for document uploads
 */
const uploadDocument = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1, // Single file
  },
});

/**
 * Multer configuration for multiple image uploads
 */
const uploadMultipleImages = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 10, // Up to 10 images
  },
});

/**
 * Multer configuration for image or document uploads
 */
const uploadImageOrDocument = multer({
  storage: storage,
  fileFilter: imageOrDocumentFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE, // Use document size limit (larger)
    files: 1,
  },
});

/**
 * Middleware to handle file upload errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `File size exceeds the maximum allowed size.`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: `Maximum number of files exceeded.`,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: `Unexpected file field name.`,
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
    });
  }
  
  if (err) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
    });
  }
  
  next();
};

/**
 * Validate uploaded file
 */
const validateUploadedFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please upload a file.',
    });
  }
  
  // Additional validation can be added here
  // e.g., check file dimensions for images, scan for viruses, etc.
  
  next();
};

/**
 * Get file URL helper
 */
const getFileUrl = (req, filename) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  // Extract relative path from absolute path
  const relativePath = filename.replace(path.join(__dirname, '../'), '').replace(/\\/g, '/');
  return `${baseUrl}/${relativePath}`;
};

module.exports = {
  uploadImage,
  uploadDocument,
  uploadMultipleImages,
  uploadImageOrDocument,
  handleUploadError,
  validateUploadedFile,
  getFileUrl,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_VIDEO_SIZE,
};

