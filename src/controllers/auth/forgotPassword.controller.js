import { client } from "../../lib/sanity.js";
import crypto from "crypto";
import { addMinutes } from "date-fns";
import { sendPasswordResetEmail } from "../../lib/mailer.js";
import { hashOtp } from "../../lib/auth.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
import { sendResponse } from "../../lib/response.js";
import { findUserByEmail } from "../../lib/findUserByEmail.js";

export const forgotPassword = asyncHandler(async (req, res) => {
  const sanitized = sanitizeInput(req.body);
  const email = sanitized.email?.trim().toLowerCase();

  // Always return generic response (anti-enumeration)
  if (!email) {
    return sendResponse(
      res,
      true,
      "If the account exists, an OTP has been sent"
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendResponse(
      res,
      true,
      "If the account exists, an OTP has been sent"
    );
  }

  const user = await findUserByEmail(email);

  // Prevent account enumeration
  if (!user) {
    return sendResponse(
      res,
      true,
      "If the account exists, an OTP has been sent"
    );
  }

  // Generate secure OTP (4-digit)
  const otp = crypto.randomInt(1000, 10000).toString();

  const hashedOtp = await hashOtp(otp);
  const otpExpiry = addMinutes(new Date(), 10).toISOString();

  await client
    .patch(user._id)
    .set({
      otp: hashedOtp,
      otpExpiry,
      otpVerified: false,
      _updatedAt: new Date().toISOString(),
    })
    .commit();

  // Send email (non-blocking)
  sendPasswordResetEmail(
    user.email,
    user.username || "User",
    otp
  ).catch((err) => {
    console.error("Failed to send OTP email:", err);
  });

  return sendResponse(
    res,
    true,
    "If the account exists, an OTP has been sent"
  );
});