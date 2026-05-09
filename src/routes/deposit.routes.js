import express from "express";
import {
  getDepositHistoryHandler,
  getOxapayAddressHandler,
  notifyOxapayPaymentHandler,
  oxapayWebhookHandler,
} from "../controllers/deposit.controller.js";
import { withAuth } from "../middlewares/auth/authGuard.js";

const router = express.Router();

router.get("/history", getDepositHistoryHandler);

// OxaPay Routes
router.post("/oxapay-address", withAuth, getOxapayAddressHandler);
router.post("/oxapay-notify", withAuth, notifyOxapayPaymentHandler);
router.post("/oxapay-webhook", oxapayWebhookHandler);

export default router;
