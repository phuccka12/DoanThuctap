const express = require('express');
const router = express.Router();
const writingPromptController = require('../../controllers/WritingPrompt');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');
const validate = require('../../middlewares/validate');
const { createWritingPromptSchema, updateWritingPromptSchema } = require('../../validators/writingPromptValidator');

// Tất cả routes này yêu cầu admin
router.use(protect, requireAdmin);

router.post('/', validate(createWritingPromptSchema), writingPromptController.createWritingPrompt);
router.get('/', writingPromptController.getAllWritingPromptsAdmin);
router.get('/:id', writingPromptController.getWritingPromptById);
router.put('/:id', validate(updateWritingPromptSchema), writingPromptController.updateWritingPrompt);
router.delete('/:id', writingPromptController.deleteWritingPrompt);

module.exports = router;