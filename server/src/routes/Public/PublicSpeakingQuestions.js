const express = require('express');
const router = express.Router();
const speakingQuestionController = require('../../controllers/SpeakingQuestion');

// Public endpoint - không cần auth
router.get('/random', speakingQuestionController.getRandomSpeakingQuestion);
router.get('/',       speakingQuestionController.getPublicSpeakingQuestions);
router.get('/:id',   speakingQuestionController.getSpeakingQuestionById);

module.exports = router;