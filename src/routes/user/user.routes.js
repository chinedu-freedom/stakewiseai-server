import express from "express";
import { getUserActivitiesController } from "../../controllers/user/userActivity.controller.js";
import { withAuth } from "../../middlewares/auth/authGuard.js";
import { upload } from "../../middlewares/upload.js";
import { getDashboardStatsController } from "../../controllers/user/dashboardStats.controller.js";
import {
  getUserProfileController,
  updateUserProfileController,
} from "../../controllers/user/userProfile.controller.js";
import { getReferralsController } from "../../controllers/user/userReferrals.controllers.js";
import { changePasswordController } from "../../controllers/user/changePassword.controller.js";
import { submitKycHandler, getUserKycHandler, resubmitKycHandler } from "../../controllers/user/kyc.controller.js";

const router = express.Router();

router.get("/activities", withAuth, getUserActivitiesController);
router.get("/dashboard-stats", withAuth, getDashboardStatsController);
router.get("/me", withAuth, getUserProfileController);
router.patch("/me", withAuth, updateUserProfileController);
router.get("/referrals", withAuth, getReferralsController);
router.post("/change-password", withAuth, changePasswordController);
router.post(
  "/kyc",
  withAuth,
  upload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
  ]),
  submitKycHandler
);
router.get("/kyc/me", withAuth, getUserKycHandler);
router.get("/kyc/resubmit", withAuth, resubmitKycHandler);

export default router;
