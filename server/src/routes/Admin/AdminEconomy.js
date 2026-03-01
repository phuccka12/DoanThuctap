const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/AdminEconomy');
const { protect }  = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

router.get('/',  ctrl.getEconomySettings);
router.post('/', ctrl.updateEconomySettings);

module.exports = router;
