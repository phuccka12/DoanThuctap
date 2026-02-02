const express = require('express');
const router = express.Router();
const { getStats } = require('../../controllers/AdminStats');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

// GET /api/admin/stats
router.get('/', getStats);

module.exports = router;
