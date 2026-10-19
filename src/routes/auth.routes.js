import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyUserOtp,
  verifyEmail,
  resendVerification,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/request-otp", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyUserOtp);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);


export default router;
