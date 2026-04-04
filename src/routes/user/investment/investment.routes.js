import express from "express";
import { createCryptoInvestmentHandler } from "../../../controllers/user/investment/cryptoInvestment.controller.js";
import { withKycAuth } from "../../../middlewares/auth/kycGuard.js";
import { withAuth } from "../../../middlewares/auth/authGuard.js";
import { createLoanInvestmentHandler, loanPreviewHandler, getAllLoansHandler } from "../../../controllers/user/investment/loanInvestment.controller.js";
import { createStockBondInvestmentHandler, getAllStockBondAnalyticsHandler } from "../../../controllers/user/investment/stockBondInvestment.controller.js";
import {
  createRealEstateInvestmentHandler,
  getAllRealEstateAnalyticsHandler
} from "../../../controllers/user/investment/realEstateInvestment.controller.js";
import { fetchAllInvestmentsController  } from "../../../controllers/user/investment/userInvestment.controller.js";

const router = express.Router();

router.get("/", withAuth, fetchAllInvestmentsController);
router.post(
  "/crypto",
  withAuth,
  withKycAuth,
  createCryptoInvestmentHandler
);
router.post("/loan", withAuth, withKycAuth, createLoanInvestmentHandler);
router.post("/loan/preview", withAuth, withKycAuth, loanPreviewHandler);
router.get("/loan/analytics",
   withAuth,
   getAllLoansHandler);
router.post(
  "/stock-bond",
  withAuth,
  withKycAuth,
  createStockBondInvestmentHandler
);
router.get(
  "/stock-bond/analytics",
  withAuth,
  getAllStockBondAnalyticsHandler
);
router.get(
  "/real-estate/analytics",
  withAuth,
  getAllRealEstateAnalyticsHandler
);
router.post(
  "/real-estate",
  withAuth,
  withKycAuth,
  createRealEstateInvestmentHandler
);
export default router;
