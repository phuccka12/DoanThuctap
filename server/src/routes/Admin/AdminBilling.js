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
// ── Static sub-paths MUST come before /:id routes ──
router.patch('/transactions/bulk-hide', ctrl.bulkHideTransactions);
// ── Per-ID routes ──
router.patch('/transactions/:id/status', ctrl.updateTransactionStatus);
router.post('/transactions/:id/sync-vnpay', ctrl.syncVnpayTransaction);
router.patch('/transactions/:id/hide', ctrl.hideTransaction);

module.exports = router;
