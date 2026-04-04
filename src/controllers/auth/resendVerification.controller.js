import { client } from "../../lib/sanity.js";
import { createHash, randomBytes } from "crypto";
import { addMinutes, isAfter } from "date-fns";
import { sendVerificationEmail } from "../../lib/mailer.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
import { sendResponse } from "../../lib/response.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { findUserByEmail } from "../../lib/findUserByEmail.js";
import bcrypt from "bcryptjs";

export const resendVerification = asyncHandler(async (req, res) => {
  const sanitized = sanitizeInput(req.body);
  const email = sanitized.email?.trim().toLowerCase();

  // Always return generic response (anti-enumeration)
  if (!email) {
    return sendResponse(
      res,
      true,
      "If the email exists, a verification email will be sent",
      200
    );
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return sendResponse(
      res,
      true,
      "If the email exists, a verification email will be sent",
      200
    );
  }

  // Already verified → still return generic message
  if (user.emailVerified) {
    return sendResponse(
      res,
      true,
      "If the email exists, a verification email will be sent",
      200
    );
  }

  // Rate limit resend
  if (user.tokenExpiresAt && isAfter(new Date(user.tokenExpiresAt), new Date())) {
    return sendResponse(
      res,
      true,
      "If the email exists, a verification email will be sent",
      200
    );
  }

  // Generate new token
  const token = randomBytes(32).toString("hex");
  const tokenDigest = createHash("sha256").update(token).digest("hex");

  const verificationToken = await bcrypt.hash(
    token,
    parseInt(process.env.SALT_ROUNDS) || 10
  );

  const tokenExpiresAt = addMinutes(new Date(), 15).toISOString();

  await client
    .patch(user._id)
    .set({
      tokenDigest,
      verificationToken,
      tokenExpiresAt,
      accountStatus: "pending",
      _updatedAt: new Date().toISOString(),
    })
    .commit();

  // Send email (non-blocking but safe)
  sendVerificationEmail({
    email: user.email,
    name: user.username || "User",
    token,
  }).catch((err) => {
    console.error("VERIFICATION_EMAIL_FAILED:", err);
  });

  return sendResponse(
    res,
    true,
    "If the email exists, a verification email will be sent",
    200
  );
});