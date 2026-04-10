import express from "express";
import { withAuth } from "../../middlewares/auth/authGuard.js";
import { getDashboardStatsController } from "../../controllers/user/dashboardStats.controller.js";
import {
  getUserProfileController,
  updateUserProfileController,
} from "../../controllers/user/userProfile.controller.js";
import { getReferralsController } from "../../controllers/user/userReferrals.controllers.js";
import { changePasswordController } from "../../controllers/user/changePassword.controller.js";
import { upload } from "../../middlewares/upload.js";

const router = express.Router();

router.get("/dashboard-stats", withAuth, getDashboardStatsController);
router.get("/me", withAuth, getUserProfileController);
router.patch(
  "/me",
  withAuth,
  upload.single("image"),
  updateUserProfileController
);
router.get("/referrals", withAuth, getReferralsController);
router.post("/change-password", withAuth, changePasswordController);


export default router;
