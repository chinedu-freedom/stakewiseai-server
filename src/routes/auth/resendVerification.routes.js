import express from "express";
import { resendVerification } from "../../controllers/auth/resendVerification.controller.js";

const router = express.Router();

router.post("/", resendVerification);

export default router;