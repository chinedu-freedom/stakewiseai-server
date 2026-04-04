import express from "express";
import { forgotPassword } from "../../controllers/auth/forgotPassword.controller.js";

const router = express.Router();

router.post("/", forgotPassword);

export default router;