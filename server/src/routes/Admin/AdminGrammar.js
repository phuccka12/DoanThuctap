const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/AdminGrammar');
const { protect }    = require('../../middlewares/authMiddleware');
const requireAdmin   = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

// AI auto-generate — phải đặt TRƯỚC /:id
router.post('/ai-generate', ctrl.aiGenerate);

// CRUD
router.get('/',     ctrl.getList);
router.post('/',    ctrl.create);
router.get('/:id',  ctrl.getOne);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
