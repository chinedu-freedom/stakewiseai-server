import express from "express";
import { contactHandler } from "../../controllers/contact/contact.controller.js";

const router = express.Router();

router.post("/", contactHandler);

export default router;
