const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/PublicListening');
const { protect } = require('../../middlewares/authMiddleware');

router.get('/',            protect, ctrl.getList);
router.get('/topics',      protect, ctrl.getTopics);
router.get('/:id',         protect, ctrl.getOne);
router.post('/:id/submit', protect, ctrl.submit);

module.exports = router;
