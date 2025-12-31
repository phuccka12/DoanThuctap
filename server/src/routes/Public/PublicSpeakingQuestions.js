const express = require('express');
const router = express.Router();
const speakingQuestionController = require('../../controllers/SpeakingQuestion');

// Public endpoint - không cần auth
router.get('/', speakingQuestionController.getPublicSpeakingQuestions);

module.exports = router;