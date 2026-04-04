import { client } from "../../lib/sanity.js";
import { comparePasswords, hashPassword } from "../../lib/auth.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
import { sendResponse } from "../../lib/response.js";
import { findUserByEmail } from "../../lib/findUserByEmail.js";
import { sendPasswordResetConfirmationEmail } from "../../lib/mailer.js";
import { validateFields } from "../../lib/validateFields.js";

export const resetPassword = asyncHandler(async (req, res) => {
  const sanitized = sanitizeInput(req.body);
  const email = sanitized.email?.trim().toLowerCase();
  const { newPassword } = sanitized;

  if (!email || !newPassword) {
    return sendResponse(
      res,
      false,
      "Email and new password are required",
      400
    );
  }

  // Validate password strength
  const validationError = validateFields(["password"], {
    password: newPassword,
  });

  if (validationError) {
    return sendResponse(res, false, validationError, 400);
  }

  const user = await findUserByEmail(email);

  // Validate user + OTP verification
  if (!user || !user.otpVerified) {
    return sendResponse(res, false, "Invalid credentials", 400);
  }

  // Prevent reuse of old password
  const isSamePassword = await comparePasswords(
    newPassword,
    user.password
  );

  if (isSamePassword) {
    return sendResponse(
      res,
      false,
      "New password must be different from the current password",
      400
    );
  }

  const hashedPassword = await hashPassword(newPassword);

  await client
    .patch(user._id)
    .set({
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
      otpVerified: false,
      _updatedAt: new Date().toISOString(),
    })
    .commit();

  // Send confirmation email (non-blocking)
  sendPasswordResetConfirmationEmail(
    user.email,
    user.username || "User"
  ).catch((err) => {
    console.error("Failed to send reset confirmation email:", err);
  });

  return sendResponse(res, true, "Password reset successful");
});