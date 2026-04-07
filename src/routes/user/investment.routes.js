import express from "express";
import { withAuth } from "../../middlewares/auth/authGuard.js";
import { createCryptoInvestmentHandler } from "../../controllers/investment.controller.js";
// import { fetchAllInvestmentsController } from "../../controllers/investment.controller.js";


const router = express.Router();

// router.get("/", withAuth, fetchAllInvestmentsController);
router.post(
  "/crypto",
  withAuth,
  createCryptoInvestmentHandler
);
export default router;
