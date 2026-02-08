const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../../middlewares/authMiddleware');
const vocabularyController = require('../../controllers/Vocabulary');

/**
 * Admin Vocabulary Routes
 * Base path: /api/admin/vocab
 * All routes require authentication and admin role
 */

// Statistics (must be before /:id)
router.get('/stats', protect, requireAdmin, vocabularyController.getStatistics);

// Export CSV (must be before /:id)
router.get('/export', protect, requireAdmin, vocabularyController.exportCSV);

// List vocabularies (with pagination & filters)
router.get('/', protect, requireAdmin, vocabularyController.getVocabularies);

// Get single vocabulary (after specific routes)
router.get('/:id', protect, requireAdmin, vocabularyController.getVocabularyById);

// Create vocabulary
router.post('/', protect, requireAdmin, vocabularyController.createVocabulary);

// Import CSV (must be before /:id if using POST)
router.post('/import', protect, requireAdmin, vocabularyController.importCSV);

// Bulk delete (must be before /:id)
router.delete('/bulk', protect, requireAdmin, vocabularyController.bulkDelete);

// Update vocabulary
router.put('/:id', protect, requireAdmin, vocabularyController.updateVocabulary);

// Delete vocabulary
router.delete('/:id', protect, requireAdmin, vocabularyController.deleteVocabulary);

module.exports = router;
