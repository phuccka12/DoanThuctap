'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/StoryController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Optional auth — attaches req.userId when a valid Bearer token is present,
 * but does NOT block unauthenticated requests.
 */
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

// ── Public / Optional-auth ────────────────────────────────────────────────────
// Story lobby list (progress overlay added when authenticated)
router.get('/', optionalAuth, ctrl.getStories);

// Full story document (parts + sentences, with unlock status when authenticated)
router.get('/:storyId', optionalAuth, ctrl.getStoryById);

// ── Authenticated ─────────────────────────────────────────────────────────────
// Per-user progress for a story
router.get('/:storyId/progress', protect, ctrl.getStoryProgress);

// Submit translations for a part — returns AI grades per sentence
router.post('/:storyId/parts/:partNum/submit', protect, ctrl.submitPartTranslations);

// Mark a part complete + award coins/XP
router.post('/:storyId/parts/:partNum/complete', protect, ctrl.completeStoryPart);

module.exports = router;
