import express from "express";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import depositRoutes from "./routes/deposit.routes.js";
import investmentRoutes from "./routes/investment.routes.js";
import userInvestmentRoutes from "./routes/user/investment.routes.js";
import userRoutes from "./routes/user/user.routes.js";
import { startInvestmentScheduler } from "./job/planScheduler.js";

const app = express();

// Security headers
app.use(helmet());

// Request logging (only in development)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Parse bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  "https://blockvextrade.com",
  "https://www.blockvextrade.com",
  "https://api.blockvextrade.com",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : [])
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      // Allow subdomains of blockvextrade.com
      if (/^https:\/\/(.*\.)?blockvextrade\.com$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

startInvestmentScheduler();

app.use("/api/auth", authRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/investment", investmentRoutes);
app.use("/api/users/investments", userInvestmentRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Multer file upload error handler (specific)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("Only")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
});

const shutdown = (signal) => {
  console.log(`Received ${signal}. Closing server gracefully...`);
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;
