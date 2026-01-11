const express = require("express");
const router = express.Router();
const onboardingController = require("../controllers/onboardingController");
const { protect } = require("../middlewares/authMiddleware"); // Changed from authenticateToken to protect

// Save onboarding data (protected)
router.post("/", protect, onboardingController.saveOnboarding);

// Get onboarding status (protected)
router.get("/status", protect, onboardingController.getOnboardingStatus);

module.exports = router;
