import express from "express";

import {
  getUserVipController
} from "../controllers/vip.controller.js";
import { withAuth } from "../middlewares/auth/authGuard.js";

const router = express.Router();

router.get("/vip", withAuth, getUserVipController);


export default router;
