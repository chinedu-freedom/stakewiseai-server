import express from "express";
import { withAuth } from "../middlewares/auth/authGuard.js";
import { getPlanByIdHandler, getPlansHandler } from "../controllers/investment.controller.js";

const router = express.Router();

router.get("/plans", withAuth, getPlansHandler);
router.get("/plans/:id", withAuth, getPlanByIdHandler);

export default router;
