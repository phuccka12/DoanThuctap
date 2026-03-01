const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/AdminAntiCheat');
const { protect }  = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

router.get('/logs',                       ctrl.getLogs);
router.get('/suspicious',                 ctrl.getSuspiciousActivity);
router.get('/user/:userId',               ctrl.getUserDetail);
router.post('/user/:userId/coins',        ctrl.adjustCoins);
router.post('/pet/:petId/reset',          ctrl.resetPet);

module.exports = router;
