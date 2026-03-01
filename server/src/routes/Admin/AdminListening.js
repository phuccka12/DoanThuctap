const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/AdminListening');
const { protect }    = require('../../middlewares/authMiddleware');
const requireAdmin   = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

router.get('/stats',  ctrl.getStats);
router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      ctrl.create);
router.put('/:id',    ctrl.update);
router.patch('/:id/toggle', ctrl.toggleActive);
router.delete('/:id', ctrl.remove);

module.exports = router;
