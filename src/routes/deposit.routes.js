import express from "express";
import { upload } from "../middlewares/upload.js";
import {
  createDepositHandler,
  getDepositHistoryHandler,
  getOxapayAddressHandler,
  notifyOxapayPaymentHandler,
  oxapayWebhookHandler,
} from "../controllers/deposit.controller.js";
import { withAuth } from "../middlewares/auth/authGuard.js";

const router = express.Router();

router.post(
  "/",
  withAuth,
  upload.single("proofOfPayment"),
  createDepositHandler
);

router.get("/history", getDepositHistoryHandler);

// ── OxaPay automatic deposit ─────────────────────────────────────────────────
// Get USDT TRC20 payment address (dynamic invoice or static fallback)
router.get("/oxapay-address", withAuth, getOxapayAddressHandler);

// User notifies backend they've sent payment → creates pending deposit record
router.post("/oxapay-notify", withAuth, notifyOxapayPaymentHandler);

// OxaPay server-to-server webhook → auto-approves + credits user balance
// NOTE: This route must be public (no withAuth) — OxaPay calls it, not the browser
router.post("/oxapay-webhook", oxapayWebhookHandler);

export default router;
