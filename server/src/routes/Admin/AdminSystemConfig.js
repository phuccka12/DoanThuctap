const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/AdminSystemConfig');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

router.get('/', ctrl.getConfigs);
router.patch('/:key', ctrl.updateConfig);
router.post('/bulk', ctrl.updateConfigsBulk);

module.exports = router;
