const express = require('express');
const router = express.Router();
const speakingQuestionController = require('../../controllers/SpeakingQuestion');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');
const validate = require('../../middlewares/validate');
const { createSpeakingQuestionSchema, updateSpeakingQuestionSchema } = require('../../validators/speakingQuestionValidator');

// Tất cả routes này yêu cầu admin
router.use(protect, requireAdmin);

router.post('/', validate(createSpeakingQuestionSchema), speakingQuestionController.createSpeakingQuestion);
router.get('/', speakingQuestionController.getAllSpeakingQuestionsAdmin);
router.get('/:id', speakingQuestionController.getSpeakingQuestionById);
router.put('/:id', validate(updateSpeakingQuestionSchema), speakingQuestionController.updateSpeakingQuestion);
router.delete('/:id', speakingQuestionController.deleteSpeakingQuestion);

module.exports = router;