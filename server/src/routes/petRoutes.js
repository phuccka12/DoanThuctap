const express = require('express');
const router = express.Router();
const petController = require('../controllers/PetController');
const { protect } = require('../middlewares/authMiddleware');

// TEST route (no auth) - để test xem route có hoạt động không
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Pet route works!', timestamp: new Date() });
});

// All routes require authentication
router.get('/', protect, petController.getStatus);
router.post('/checkin', protect, petController.checkin);
router.post('/feed', protect, petController.feed);
router.post('/play', protect, petController.play);

module.exports = router;
