const express = require('express');
const router = express.Router();
const topicController = require('../../controllers/Topic');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');
const validate = require('../../middlewares/validate');
const { createTopicSchema, updateTopicSchema } = require('../../validators/topicValidator');

// Tất cả routes này yêu cầu admin
router.use(protect, requireAdmin);

router.post('/', validate(createTopicSchema), topicController.createTopic);
router.get('/', topicController.getAllTopicsAdmin);
router.get('/:id', topicController.getTopicById);
router.put('/:id', validate(updateTopicSchema), topicController.updateTopic);
router.delete('/:id', topicController.deleteTopic);

module.exports = router;