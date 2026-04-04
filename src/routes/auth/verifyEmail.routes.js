import express from "express";
import { verifyEmail } from "../../controllers/auth/verifyEmail.controller.js";

const router = express.Router();

router.get("/", verifyEmail);

export default router;
