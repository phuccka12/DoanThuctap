const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getProfile, updateProfile, getCoinHistory } = require('../controllers/userController');

router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, updateProfile);
router.get('/coins/history', protect, getCoinHistory);

module.exports = router;
