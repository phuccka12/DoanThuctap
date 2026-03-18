const express = require('express');
const router = express.Router();
const writingScenarioController = require('../controllers/WritingScenario');
const { protect } = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/requireAdmin');

// ========================================
// USER ROUTES (Protected - Students)
// ========================================

// Validate submission in real-time
router.post(
  '/:id/validate',
  protect,
  writingScenarioController.validateSubmission
);

// Get all active scenarios for users
router.get(
  '/',
  protect,
  writingScenarioController.getAllScenariosUser
);

// Get single scenario for users
router.get(
  '/:id',
  protect,
  writingScenarioController.getScenarioById
);

// Evaluate submission with AI
router.post(
  '/:id/evaluate',
  protect,
  writingScenarioController.evaluateSubmission
);

// Get submission history for a scenario
router.get(
  '/:id/history',
  protect,
  writingScenarioController.getScenarioHistory
);

module.exports = exports;
module.exports = router;
