const express = require('express');
const router = express.Router();
const multer = require('multer');
const readingPassageController = require('../controllers/ReadingPassage');
const { protect } = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/requireAdmin');

// CSV Upload middleware
const csvUpload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * Reading Passage Routes
 * All routes require authentication and admin privileges
 */

// Get statistics (must be before /:id route)
router.get(
  '/stats',
  protect,
  adminMiddleware,
  readingPassageController.getReadingPassageStats
);

// Export to CSV (must be before /:id route)
router.get(
  '/export',
  protect,
  adminMiddleware,
  readingPassageController.exportReadingPassagesToCSV
);

// Get all reading passages (with filters)
router.get(
  '/',
  protect,
  adminMiddleware,
  readingPassageController.getAllReadingPassagesAdmin
);

// Get passages for lesson builder (public for course creators)
router.get(
  '/for-lesson-builder',
  protect,
  readingPassageController.getPassagesForLessonBuilder
);

// Create reading passage
router.post(
  '/',
  protect,
  adminMiddleware,
  readingPassageController.createReadingPassage
);

// AI Generate Text (Old simple version - kept for backward compatibility)
router.post(
  '/generate-ai',
  protect,
  adminMiddleware,
  readingPassageController.generatePassageWithAI
);

// Agentic AI Generate (NEW - Multi-Agent System with Self-Correction)
router.post(
  '/agentic-generate',
  protect,
  adminMiddleware,
  readingPassageController.generateWithAI
);

// Scan & Link Vocabulary
router.post(
  '/:id/scan-vocabulary',
  protect,
  adminMiddleware,
  readingPassageController.scanAndLinkVocabulary
);

// Track Usage
router.post(
  '/:id/track-usage',
  protect,
  readingPassageController.trackPassageUsage
);

// Update reading passage
router.put(
  '/:id',
  protect,
  adminMiddleware,
  readingPassageController.updateReadingPassage
);

// Delete reading passage
router.delete(
  '/:id',
  protect,
  adminMiddleware,
  readingPassageController.deleteReadingPassage
);

// Bulk delete
router.post(
  '/bulk-delete',
  protect,
  adminMiddleware,
  readingPassageController.bulkDeleteReadingPassages
);

// Import from CSV
// Import from CSV
router.post(
  '/import',
  protect,
  adminMiddleware,
  csvUpload.single('file'),
  readingPassageController.importReadingPassagesFromCSV
);

module.exports = router;
