const express = require('express');
const router = express.Router();
const topicController = require('../../controllers/Topic');

// Public endpoint - không cần auth
router.get('/', topicController.getPublicTopics);

module.exports = router;
