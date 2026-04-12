import express from "express";
import { spinWheelController, getSpinHistoryController } from "../controllers/spin.controller.js";
import { withAuth } from "../middlewares/auth/authGuard.js";

const router = express.Router();

// POST /api/spin       — Execute a spin
router.post("/", withAuth, spinWheelController);

// GET  /api/spin/history — Get user's spin history
router.get("/history", withAuth, getSpinHistoryController);

export default router;
