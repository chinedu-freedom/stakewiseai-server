import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resendVerification,
  resetPassword,
  verifyEmail,
  verifyUserOtp,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/request-otp", forgotPassword);
router.post("/resend-verification", resendVerification);
router.post("/reset-password", resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/verify-otp", verifyUserOtp);


export default router;
