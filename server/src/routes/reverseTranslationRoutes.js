'use strict';
/**
 * reverseTranslationRoutes.js
 * mounted at /api/reverse-translation
 */
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ReverseTranslationController');
const { protect } = require('../middlewares/authMiddleware');

// Public — browse bộ đề
router.get('/sets',          ctrl.listSets);
router.get('/sets/:setId',   ctrl.getSet);

// Protected — luyện tập
router.post('/session/start',                  protect, ctrl.startSession);
router.get('/session/active',                  protect, ctrl.getActiveSession);
router.post('/session/:sessionId/grade',       protect, ctrl.gradeItem);
router.post('/session/:sessionId/hint',        protect, ctrl.buyHint);
router.post('/session/:sessionId/complete',    protect, ctrl.completeSession);

module.exports = router;
