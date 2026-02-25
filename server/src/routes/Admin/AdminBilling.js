const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/AdminBilling');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

// Plans
router.get('/plans', ctrl.getPlans);
router.post('/plans', ctrl.createPlan);
router.put('/plans/:id', ctrl.updatePlan);
router.delete('/plans/:id', ctrl.deletePlan);

// Transactions
router.get('/transactions/stats', ctrl.getTransactionStats);
router.get('/transactions/revenue', ctrl.getRevenueByMonth);
router.get('/transactions', ctrl.getTransactions);
router.post('/transactions', ctrl.createManualTransaction);
router.patch('/transactions/:id/status', ctrl.updateTransactionStatus);
router.delete('/transactions/bulk', ctrl.bulkDeleteTransactions);
router.delete('/transactions/:id', ctrl.deleteTransaction);

module.exports = router;
