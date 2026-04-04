import bcrypt from "bcryptjs";
import crypto from "crypto";
import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
import { sendResponse } from "../../lib/response.js";

export const verifyEmail = asyncHandler(async (req, res) => {
  const rawToken = sanitizeInput(req.query.token)?.trim();

  if (!rawToken) {
    return sendResponse(res, false, "Verification token is required", 400);
  }

  // Create digest for lookup
  const digest = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await client.fetch(
    `*[_type == "user" && tokenDigest == $digest && !emailVerified][0]`,
    { digest }
  );

  if (!user) {
    return sendResponse(
      res,
      false,
      "Invalid or expired verification token",
      400
    );
  }

  // Compare hashed token
  const tokenMatch = await bcrypt.compare(
    rawToken,
    user.verificationToken
  );

  if (!tokenMatch) {
    return sendResponse(
      res,
      false,
      "Invalid or expired verification token",
      400
    );
  }

  // Check expiry
  if (
    user.tokenExpiresAt &&
    new Date() > new Date(user.tokenExpiresAt)
  ) {
    return sendResponse(
      res,
      false,
      "Verification token has expired",
      400
    );
  }

  // Activate user + give welcome bonus
  const updatedUser = await client
    .patch(user._id)
    .set({
      emailVerified: true,
      accountStatus: "active",
      verificationToken: null,
      tokenDigest: null,
      tokenExpiresAt: null,
      _updatedAt: new Date().toISOString(),
    })
    .setIfMissing({ accountBalance: 0 })
    .inc({ accountBalance: 10 }) // welcome bonus
    .commit();

  return sendResponse(res, true, "Email verified successfully!", 200, {
    userId: updatedUser._id,
    email: updatedUser.email,
    accountBalance: updatedUser.accountBalance,
  });
});