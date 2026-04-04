import express from "express";
import { completeProfile } from "../../controllers/auth/completeProfile.controller.js";
import { withAuth } from "../../middlewares/auth/authGuard.js";

const router = express.Router();

router.post(
  "/",
  withAuth,
  completeProfile
);

export default router;
