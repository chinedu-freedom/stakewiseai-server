import express from "express";
import { withAuth } from "../../middlewares/auth/authGuard.js";
import { createInvestmentHandler } from "../../controllers/investment.controller.js";
// import { fetchAllInvestmentsController } from "../../controllers/investment.controller.js";


const router = express.Router();

// router.get("/", withAuth, fetchAllInvestmentsController);
router.post(
  "/crypto",
  withAuth,
  createInvestmentHandler
);
export default router;
