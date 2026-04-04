import express from "express";
import { withAuth } from "../../middlewares/auth/authGuard.js";
import { getCryptoPlansHandler } from "../../controllers/investment/cryptoInvestments.controller.js";
import { getLoanPlansHandler  } from "../../controllers/investment/loanInvestments.controller.js";
import { getRealEstatePlansHandler  } from "../../controllers/investment/realEstateInvestments.controller.js";
import { getStockBondPlansHandler  } from "../../controllers/investment/stockBondInvestments.controller.js";

const router = express.Router();

router.get("/crypto/plans", withAuth, getCryptoPlansHandler);
router.get("/loan/plans", withAuth, getLoanPlansHandler);
router.get("/real-estate/plans", withAuth, getRealEstatePlansHandler);
router.get("/stock-bond/plans", withAuth, getStockBondPlansHandler);

export default router;
