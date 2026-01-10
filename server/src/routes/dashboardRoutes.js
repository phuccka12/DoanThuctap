const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get('/dashboard', dashboardController.getDashboardData);
router.get('/practice/today', dashboardController.getTodayTasks);
router.get('/analytics/time-spent', dashboardController.getTimeSpent);
router.get('/scores/latest', dashboardController.getLatestScores);
router.get('/reminders', dashboardController.getReminders);
router.get('/user/goals/current', dashboardController.getUserGoals);

module.exports = router;
