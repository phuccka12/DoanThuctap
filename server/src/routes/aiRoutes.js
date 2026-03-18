// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Tất cả các route AI đều cần đăng nhập để cộng Coins/EXP
router.use(protect);

// Định nghĩa đường dẫn
// POST /api/ai/writing
router.post('/writing', aiController.checkWriting);

// POST /api/ai/speaking (Hỗ trợ upload file ghi âm)
router.post('/speaking', upload.single('audio'), aiController.checkSpeaking);

// POST /api/ai/recommend
router.post('/recommend', aiController.getRecommendation);

// POST /api/ai/conversation (Hội thoại AI - Proxy qua Python)
router.post('/conversation', upload.single('audio'), aiController.handleConversation);

module.exports = router;