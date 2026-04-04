import express from "express";
import { withAuth } from "../../middlewares/auth/authGuard.js";
import { getCryptoPlansHandler } from "../../controllers/investment/cryptoInvestments.controller.js";

const router = express.Router();

router.get("/crypto/plans", withAuth, getCryptoPlansHandler);

export default router;
