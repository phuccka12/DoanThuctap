const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/SpeakingQuestion');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

router.get('/stats', ctrl.getSpeakingStats);
router.post('/generate-sample', ctrl.generateSampleAnswer);
router.get('/', ctrl.getAllSpeakingQuestionsAdmin);
router.post('/', ctrl.createSpeakingQuestion);
router.post('/bulk-delete', ctrl.bulkDeleteSpeakingQuestions);
router.get('/:id', ctrl.getSpeakingQuestionById);
router.put('/:id', ctrl.updateSpeakingQuestion);
router.delete('/:id', ctrl.deleteSpeakingQuestion);

module.exports = router;