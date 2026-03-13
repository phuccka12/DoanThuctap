const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { protect } = require('../../middlewares/authMiddleware');
const ctrl     = require('../../controllers/SpeakingPractice');

// Audio upload — keep in memory (buffer), max 20 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 },
});

// ── Public (khi đã login) routes ──────────────────────────────────────────────
router.get('/topics',    protect, ctrl.getTopics);
router.get('/questions', protect, ctrl.getQuestions);
router.get('/warmup',    protect, ctrl.getWarmup);

// ── Evaluate: nhận audio + form data → proxy sang Python AI ──────────────────
router.post('/evaluate', protect, upload.single('audio'), ctrl.evaluate);

module.exports = router;
