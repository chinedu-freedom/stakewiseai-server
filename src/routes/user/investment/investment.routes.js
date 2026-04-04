import express from "express";
import { createCryptoInvestmentHandler } from "../../../controllers/user/investment/cryptoInvestment.controller.js";
import { withAuth } from "../../../middlewares/auth/authGuard.js";
import { fetchAllInvestmentsController  } from "../../../controllers/user/investment/userInvestment.controller.js";

const router = express.Router();

router.get("/", withAuth, fetchAllInvestmentsController);
router.post(
  "/crypto",
  withAuth,
  createCryptoInvestmentHandler
);
export default router;
