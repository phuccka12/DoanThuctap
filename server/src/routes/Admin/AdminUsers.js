const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  resetPassword,
  updateUserStatus,
  deleteUser,
  getUserStats
} = require('../../controllers/AdminUsers');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

// Protect all routes with admin authentication
router.use(protect, requireAdmin);

// GET /api/admin/users/stats - User statistics
router.get('/stats', getUserStats);

// POST /api/admin/users - Create new user
router.post('/', createUser);

// GET /api/admin/users - Get all users with filters
router.get('/', getAllUsers);

// GET /api/admin/users/:id - Get user by ID
router.get('/:id', getUserById);

// PUT /api/admin/users/:id - Update user
router.put('/:id', updateUser);

// PATCH /api/admin/users/:id/password - Reset user password
router.patch('/:id/password', resetPassword);

// PATCH /api/admin/users/:id/status - Ban/Unban user
router.patch('/:id/status', updateUserStatus);

// DELETE /api/admin/users/:id - Delete user
router.delete('/:id', deleteUser);

module.exports = router;
