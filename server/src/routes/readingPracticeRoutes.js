const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const readingPassageController = require('../controllers/ReadingPassage');

// ── USER-FACING reading practice routes (no admin required) ──────────────────

// Topics that have at least one passage (for topic-grouped homepage)
router.get('/topics', protect, readingPassageController.getReadingTopics);

// List active passages for practice (filter by level, topic, search)
router.get('/list', protect, readingPassageController.getPassagesForPractice);

// Get single passage for practice (full data incl. vocab_highlights + questions)
router.get('/:id', protect, readingPassageController.getPassageForPractice);

// Submit reading practice results
router.post('/:id/submit', protect, readingPassageController.submitReading);

module.exports = router;
