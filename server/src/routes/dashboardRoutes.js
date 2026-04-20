const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// Dashboard routes
router.get('/dashboard', protect, dashboardController.getDashboardData);
router.get('/practice/today', protect, dashboardController.getTodayTasks);
router.get('/practice/today/refresh', protect, dashboardController.getTodayTasks); // Real-time refresh endpoint
router.get('/analytics/time-spent', protect, dashboardController.getTimeSpent);
router.get('/scores/latest', protect, dashboardController.getLatestScores);
router.get('/reminders', protect, dashboardController.getReminders);
router.get('/user/goals/current', protect, dashboardController.getUserGoals);
router.post('/heartbeat', protect, dashboardController.heartbeat);

module.exports = router;
