const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { submitPlacement, getPlacementResult, skipPlacement, startPlacementBonus } = require('../controllers/placementController');

router.post('/submit', protect, submitPlacement);
router.post('/skip', protect, skipPlacement);
router.post('/start-bonus', protect, startPlacementBonus);
router.get('/result',  protect, getPlacementResult);

module.exports = router;
