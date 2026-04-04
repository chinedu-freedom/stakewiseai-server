import express from "express";
import { withKycAuth } from "../../middlewares/auth/kycGuard.js";
import {
  createWithdrawalHandler,
  getWithdrawalsHandler,
} from "../../controllers/withdrawal/withdrawal.controller.js";
import { withAuth } from "../../middlewares/auth/authGuard.js";

const router = express.Router();

router.post("/", withAuth, withKycAuth, createWithdrawalHandler);
router.get("/history", getWithdrawalsHandler);

export default router;
