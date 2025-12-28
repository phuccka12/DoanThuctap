// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Định nghĩa đường dẫn
// POST localhost:8000/api/ai/writing
router.post('/writing', aiController.checkWriting);
router.post('/speaking', aiController.checkSpeaking);
// POST localhost:8000/api/ai/recommend
router.post('/recommend', aiController.getRecommendation);

module.exports = router;