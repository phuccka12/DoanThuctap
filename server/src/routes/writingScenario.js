const express = require('express');
const router = express.Router();
const writingScenarioController = require('../controllers/WritingScenario');
const { protect } = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/requireAdmin');

// ========================================
// ADMIN ROUTES (Protected + Admin Only)
// ========================================

// Get all scenarios with filters/pagination
router.get(
  '/admin/writing-scenarios',
  protect,
  adminMiddleware,
  writingScenarioController.getAllScenariosAdmin
);

// Get scenario statistics
router.get(
  '/admin/writing-scenarios/stats',
  protect,
  adminMiddleware,
  writingScenarioController.getScenarioStats
);

// Get single scenario
router.get(
  '/admin/writing-scenarios/:id',
  protect,
  adminMiddleware,
  writingScenarioController.getScenarioById
);

// Create scenario
router.post(
  '/admin/writing-scenarios',
  protect,
  adminMiddleware,
  writingScenarioController.createScenario
);

// Update scenario
router.put(
  '/admin/writing-scenarios/:id',
  protect,
  adminMiddleware,
  writingScenarioController.updateScenario
);

// Delete scenario
router.delete(
  '/admin/writing-scenarios/:id',
  protect,
  adminMiddleware,
  writingScenarioController.deleteScenario
);

// Bulk delete scenarios
router.post(
  '/admin/writing-scenarios/bulk-delete',
  protect,
  adminMiddleware,
  writingScenarioController.bulkDeleteScenarios
);

// ========================================
// USER ROUTES (Protected - Students)
// ========================================

// Validate submission in real-time
router.post(
  '/writing-scenarios/:id/validate',
  protect,
  writingScenarioController.validateSubmission
);

module.exports = router;
