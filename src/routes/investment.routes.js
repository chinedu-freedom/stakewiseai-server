import express from "express";
import { withAuth } from "../middlewares/auth/authGuard.js";
import { getPlansHandler } from "../controllers/investment.controller.js";

const router = express.Router();

router.get("/plans", withAuth, getPlansHandler);

export default router;
