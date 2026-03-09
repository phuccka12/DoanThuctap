'use strict';
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/VocabularyLearn');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Vocabulary Learning Routes
 * Base path: /api/vocabulary
 */

// Public (or optional-auth) — list topics with progress
const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(
      auth.split(' ')[1],
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
    );
    req.userId   = decoded.user_id;
    req.userRole = decoded.role;
  } catch { /* ignore */ }
  next();
};

// GET  /api/vocabulary/topics
router.get('/topics', optionalAuth, ctrl.getVocabTopics);

// GET  /api/vocabulary/topics/:topicId/words
router.get('/topics/:topicId/words', optionalAuth, ctrl.getTopicWords);

// POST /api/vocabulary/topics/:topicId/complete  (protected)
router.post('/topics/:topicId/complete', protect, ctrl.completeSession);

// POST /api/vocabulary/ai-fill  (protected)
router.post('/ai-fill', protect, ctrl.aiFill);

module.exports = router;
