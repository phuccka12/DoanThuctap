const express = require('express');
const router = express.Router();
const writingPromptController = require('../../controllers/WritingPrompt');

// Public endpoint - không cần auth
router.get('/', writingPromptController.getPublicWritingPrompts);

module.exports = router;