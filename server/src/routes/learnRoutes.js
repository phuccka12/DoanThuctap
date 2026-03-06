const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LearningController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Optional auth middleware — allows unauthenticated access but attaches userId if token present.
 */
const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
    req.userId   = decoded.user_id;
    req.userRole = decoded.role;
  } catch { /* ignore invalid token */ }
  next();
};

// ── Public / Optional-auth routes ─────────────────────────────────────────────
// Topic list with progress (progress only populated if authenticated)
router.get('/topics', optionalAuth, ctrl.getTopicsWithProgress);

// Lessons roadmap for a topic
router.get('/topics/:topicId/lessons', optionalAuth, ctrl.getLessonsForTopic);

// Single lesson with nodes
router.get('/lessons/:lessonId', optionalAuth, ctrl.getLessonById);

// ── Protected routes (require login) ──────────────────────────────────────────
// Complete a lesson → award coins + EXP
router.post('/lessons/:lessonId/complete', protect, ctrl.completeLesson);

// Generate personalised 7-day plan
router.post('/generate-plan', protect, ctrl.generatePlan);

// Get current active plan
router.get('/plan/current', protect, ctrl.getCurrentPlan);

// User progress summary
router.get('/progress', protect, ctrl.getProgress);

module.exports = router;
