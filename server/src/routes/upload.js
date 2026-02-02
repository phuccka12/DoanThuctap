const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { uploadFile, uploadMultipleFiles, deleteFile } = require('../controllers/uploadController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Protect all upload routes (require authentication)
router.use(protect);

/**
 * @route   POST /api/upload/single
 * @desc    Upload single file (image/audio/video)
 * @access  Private
 */
router.post('/single', upload.single('file'), uploadFile);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
router.post('/multiple', upload.array('files', 10), uploadMultipleFiles);

/**
 * @route   DELETE /api/upload
 * @desc    Delete file from Cloudinary
 * @access  Private
 */
router.delete('/', deleteFile);

module.exports = router;
