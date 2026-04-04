import express from "express";
import { upload } from "../../middlewares/upload.js";
import {
  createDepositHandler,
  getDepositHistoryHandler,
} from "../../controllers/deposit/deposit.controller.js";
import { withAuth } from "../../middlewares/auth/authGuard.js";

const router = express.Router();

router.post(
  "/",
  withAuth,
  upload.single("proofOfPayment"),
  createDepositHandler
);

router.get("/history", getDepositHistoryHandler);


export default router;
