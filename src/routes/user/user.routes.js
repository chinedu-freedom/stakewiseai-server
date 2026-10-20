import express from "express";
import { withAuth } from "../../middlewares/auth/authGuard.js";
import { getDashboardStatsController } from "../../controllers/user/dashboardStats.controller.js";
import {
  getUserProfileController,
  updateUserProfileController,
} from "../../controllers/user/userProfile.controller.js";
import { getReferralsController } from "../../controllers/user/userReferrals.controllers.js";
import { getReferralConfigController } from "../../controllers/user/referralConfig.controller.js";
import { changePasswordController } from "../../controllers/user/changePassword.controller.js";
import { upload } from "../../middlewares/upload.js";

import {
  getDailyCheckinStatusController,
  claimDailyCheckinController,
} from "../../controllers/user/dailyCheckin.controller.js";

const router = express.Router();

router.get("/dashboard-stats", withAuth, getDashboardStatsController);
router.get("/me", withAuth, getUserProfileController);
router.get("/referral-config", getReferralConfigController);
router.patch(
  "/me",
  withAuth,
  upload.single("image"),
  updateUserProfileController
);
router.get("/referrals", withAuth, getReferralsController);
router.post("/change-password", withAuth, changePasswordController);

// Daily check-in routes ($0.50 everyday)
router.get("/daily-checkin", withAuth, getDailyCheckinStatusController);
router.post("/daily-checkin/claim", withAuth, claimDailyCheckinController);


export default router;
