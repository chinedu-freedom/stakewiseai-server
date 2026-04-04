import express from "express";
import { resetPassword } from "../../controllers/auth/resetPassword.controller.js";

const router = express.Router();

router.post("/", resetPassword);

export default router;
