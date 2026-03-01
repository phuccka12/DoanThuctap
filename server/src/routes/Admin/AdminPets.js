const express = require('express');
const router = express.Router();
const {
  getPetStats,
  getAllPets,
  getPetById,
  updatePet,
  grantCoins,
  deletePet,
} = require('../../controllers/AdminPets');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

router.use(protect, requireAdmin);

// GET /api/admin/pets/stats
router.get('/stats', getPetStats);

// GET /api/admin/pets
router.get('/', getAllPets);

// GET /api/admin/pets/:id
router.get('/:id', getPetById);

// PATCH /api/admin/pets/:id
router.patch('/:id', updatePet);

// POST /api/admin/pets/:id/grant-coins
router.post('/:id/grant-coins', grantCoins);

// DELETE /api/admin/pets/:id
router.delete('/:id', deletePet);

module.exports = router;
