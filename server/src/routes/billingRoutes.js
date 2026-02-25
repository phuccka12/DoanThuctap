const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/BillingController');
const { protect } = require('../middlewares/authMiddleware');

// ── Public ──────────────────────────────────────────────────────────────────
router.get('/plans', ctrl.getPublicPlans);

// ── VNPay return (không cần auth — VNPay redirect browser về đây) ─────────────
router.get('/vnpay-return', ctrl.handleVnpayReturn);

// ── VNPay verify (frontend gọi sau khi nhận params — cần auth) ─────────────
router.post('/vnpay-verify', protect, ctrl.verifyVnpayPayment);

// ── Authenticated user ───────────────────────────────────────────────────────
router.use(protect);
router.get('/my-subscription', ctrl.getMySubscription);
router.post('/create-payment', ctrl.createVnpayPayment);
router.get('/my-transactions', ctrl.getMyTransactions);

module.exports = router;
