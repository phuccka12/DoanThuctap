const express = require('express');
const router = express.Router();
const lessonController = require('../../controllers/Lesson');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

// All routes require admin authentication
router.use(protect, requireAdmin);

// Get lessons by topic
router.get('/topics/:topicId/lessons', lessonController.getLessonsByTopic);

// Create lesson under a topic
router.post('/topics/:topicId/lessons', lessonController.createLesson);

// Reorder lessons
router.put('/topics/:topicId/lessons/reorder', lessonController.reorderLessons);

// Single lesson operations
router.get('/lessons/:id', lessonController.getLessonById);
router.put('/lessons/:id', lessonController.updateLesson);
router.delete('/lessons/:id', lessonController.deleteLesson);

module.exports = router;
