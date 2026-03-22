// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Tất cả các route AI đều cần đăng nhập để cộng Coins/EXP
router.use(protect);

// --- WRITING PRO (THE 4-STAGE PIPELINE) ---
// POST /api/ai/writing/evaluate
router.post('/writing/evaluate', aiController.evaluateWriting);

// GET /api/ai/writing/status/:taskId
router.get('/writing/status/:taskId', aiController.getWritingStatus);

// POST /api/ai/writing/model-essay
router.post('/writing/model-essay', aiController.generateModelEssay);

// POST /api/ai/writing (Route cũ, giữ lại để tương thích nếu cần)
router.post('/writing', aiController.checkWriting);

// POST /api/ai/speaking (Hỗ trợ upload file ghi âm)
router.post('/speaking', upload.single('audio'), aiController.checkSpeaking);

// POST /api/ai/recommend
router.post('/recommend', aiController.getRecommendation);

// POST /api/ai/conversation (Hội thoại AI - Proxy qua Python)
router.post('/conversation', upload.single('audio'), aiController.handleConversation);

// GET /api/ai/start (Khởi tạo hội thoại - Proxy qua Python)
router.get('/start', aiController.getStartGreeting);

module.exports = router;