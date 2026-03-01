const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ShopController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/',          ctrl.listShop);
router.get('/ranking',   ctrl.getRanking);
router.get('/inventory', protect, ctrl.getInventory);
router.post('/buy',      protect, ctrl.buyItem);
router.post('/use',      protect, ctrl.useItemHandler);

module.exports = router;
