import express from "express";
import { withAuth } from "../../middlewares/auth/authGuard.js";
import {
  createInvestmentHandler,
  fetchAllInvestmentsController,
} from "../../controllers/investments.controller.js";


const router = express.Router();

router.get("/", withAuth, fetchAllInvestmentsController);
router.post(
  "/",
  withAuth,
  createInvestmentHandler
);
export default router;
