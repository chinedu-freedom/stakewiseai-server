import express from "express";
import { createSubscriptionHandler } from "../../controllers/subscription/subscription.controller.js";

const router = express.Router();

router.post("/", createSubscriptionHandler);

export default router;
