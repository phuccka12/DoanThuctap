const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/AdminShop');
const upload  = require('../../middlewares/upload');
const { protect }     = require('../../middlewares/authMiddleware');
const requireAdmin    = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

router.get('/',              ctrl.listItems);
router.post('/',             upload.single('image'), ctrl.createItem);
router.get('/:id',           ctrl.getItem);
router.patch('/:id',         upload.single('image'), ctrl.updateItem);
router.delete('/:id',        ctrl.deleteItem);
router.delete('/:id/hard',   ctrl.hardDeleteItem);

module.exports = router;
