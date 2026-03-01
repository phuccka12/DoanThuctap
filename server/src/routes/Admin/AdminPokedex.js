const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/AdminPokedex');
const upload  = require('../../middlewares/upload');
const { protect }  = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

router.get('/',                       ctrl.listSpecies);
router.post('/',    upload.single('image'), ctrl.createSpecies);
router.get('/:id',                    ctrl.getSpecies);
router.patch('/:id', upload.single('image'), ctrl.updateSpecies);
router.post('/:id/evolution', upload.single('image'), ctrl.addEvolution);
router.delete('/:id',                 ctrl.deleteSpecies);

module.exports = router;
