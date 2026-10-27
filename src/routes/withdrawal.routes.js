import express from "express";
import {
  createWithdrawalHandler,
  getWithdrawalsHandler,
  getWithdrawalLimitsController,
} from "../controllers/withdrawal.controller.js";
import { withAuth } from "../middlewares/auth/authGuard.js";

const router = express.Router();

router.post("/", withAuth, createWithdrawalHandler);
router.get("/history", withAuth, getWithdrawalsHandler);
router.get("/limits", withAuth, getWithdrawalLimitsController);

export default router;
