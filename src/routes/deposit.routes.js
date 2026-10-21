import express from "express";
import {
  getDepositHistoryHandler,
  getOxapayAddressHandler,
  notifyOxapayPaymentHandler,
  oxapayWebhookHandler,
  syncUserPendingDepositsHandler,
} from "../controllers/deposit.controller.js";
import { withAuth } from "../middlewares/auth/authGuard.js";

const router = express.Router();

router.get("/history", withAuth, getDepositHistoryHandler);

// OxaPay Routes
router.post("/oxapay-address", withAuth, getOxapayAddressHandler);
router.post("/oxapay-notify", withAuth, notifyOxapayPaymentHandler);
router.post("/oxapay-webhook", oxapayWebhookHandler);
router.post("/sync-status", withAuth, syncUserPendingDepositsHandler);

export default router;
