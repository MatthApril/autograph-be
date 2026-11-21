const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/refresh-otp", authController.refreshOTP);
router.post("/auth/google", authController.signInWithGoogle);

module.exports = router;
