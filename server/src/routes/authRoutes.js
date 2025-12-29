const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { register, login, refresh, logout, logoutAll } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

// refresh dùng cookie nên không cần authMiddleware
router.post("/refresh", refresh);

router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAll);

router.get("/me", authMiddleware, (req, res) => res.json({ user: req.user }));

module.exports = router;
