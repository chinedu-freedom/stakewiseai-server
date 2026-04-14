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

// OxaPay Routes
router.get("/oxapay-address", getOxapayAddressHandler);
router.post("/oxapay-notify", withAuth, notifyOxapayPaymentHandler);
router.post("/oxapay-webhook", oxapayWebhookHandler);
export default router;
