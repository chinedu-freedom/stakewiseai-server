import express from "express";
import {
  createWithdrawalHandler,
  getWithdrawalsHandler,
} from "../controllers/withdrawal.controller.js";
import { withAuth } from "../middlewares/auth/authGuard.js";

const router = express.Router();

router.post("/", withAuth, createWithdrawalHandler);
router.get("/history", getWithdrawalsHandler);

export default router;
