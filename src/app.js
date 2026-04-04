import express from "express";
import multer from "multer";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth/auth.routes.js";
import forgotPassword from "./routes/auth/forgotPassword.routes.js";
import verifyOtp from "./routes/auth/verifyOtp.routes.js";
import resetPassword from "./routes/auth/resetPassword.routes.js";
import verifyEmail from "./routes/auth/verifyEmail.routes.js";
import resendVerification from "./routes/auth/resendVerification.routes.js";
import completeProfile from "./routes/auth/completeProfile.routes.js";
import google from "./routes/auth/google.routes.js";
import withdrawalRoutes from "./routes/withdrawal/withdrawal.routes.js";
import depositRoutes from "./routes/deposit/deposit.routes.js";
import subscriptionRoutes from "./routes/subscription/subscription.routes.js";
import contactRoutes from "./routes/contact/contact.routes.js";
import userActivityRoutes from "./routes/user/user.routes.js";
import investmentRoutes from "./routes/investment/investment.routes.js";
import userInvestmentRoutes from "./routes/user/investment/investment.routes.js";
import { startInvestmentScheduler } from "./job/planScheduler.js";
const app = express();

// Security headers
app.use(helmet());

// Request logging (only in development)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Enable JSON & URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

startInvestmentScheduler();

app.use("/api/auth", authRoutes);
app.use("/api/auth/request-otp", forgotPassword);
app.use("/api/auth/verify-otp", verifyOtp);
app.use("/api/auth/reset-password", resetPassword);
app.use("/api/auth/verify-email", verifyEmail);
app.use("/api/auth/resend-verification", resendVerification);
app.use("/api/auth/complete-profile", completeProfile);
app.use("/api/auth/google", google);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/users", userActivityRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/users/me/investments", userInvestmentRoutes);

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
