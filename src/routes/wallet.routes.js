import express from "express";
import {
  addWalletController,
  getUserWalletsController,
  updateWalletController,
  deleteWalletController,
} from "../controllers/wallet.controller.js";
import { withAuth } from "../middlewares/auth/authGuard.js";

const router = express.Router();

// router.post("/", withAuth, addWalletController);
// router.get("/", withAuth, getUserWalletsController);
// router.patch("/:id", withAuth, updateWalletController);
// router.delete("/:id", withAuth, deleteWalletController);

router.route("/")
.post(withAuth, addWalletController)
  .get(withAuth, getUserWalletsController);
router.route("/:id")
  .patch(withAuth, updateWalletController)
  .delete(withAuth, deleteWalletController);

export default router;