'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/StoryController');
const { protect } = require('../../middlewares/authMiddleware');

/**
 * Admin-only guard — protect validates JWT; role check done here.
 */
const adminOnly = (req, res, next) => {
  if (!req.userRole || !['admin', 'superadmin', 'moderator'].includes(req.userRole)) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
  }
  next();
};

router.use(protect, adminOnly);

// List all stories (paginated, filterable)
router.get('/',      ctrl.adminList);
// Create a new story
router.post('/',     ctrl.adminCreate);
// Get one story (full detail)
router.get('/:id',   ctrl.adminGetOne);
// Update a story
router.put('/:id',   ctrl.adminUpdate);
// Delete a story
router.delete('/:id', ctrl.adminDelete);

module.exports = router;
