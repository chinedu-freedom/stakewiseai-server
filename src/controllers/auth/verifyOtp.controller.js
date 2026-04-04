import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
import { sendResponse } from "../../lib/response.js";
import { findUserByEmail } from "../../lib/findUserByEmail.js";
import { verifyOtp } from "../../lib/auth.js";

export const verifyUserOtp = asyncHandler(async (req, res) => {
  const { email, otp } = sanitizeInput(req.body);

  if (!email || !otp) {
    return sendResponse(res, false, "Email and OTP are required", 400);
  }

  const user = await findUserByEmail(email);

  // Generic error message for security
  const genericErrorMsg = "Invalid credentials";

  if (!user || !user.otp) {
    return sendResponse(res, false, genericErrorMsg, 400);
  }

  const isOtpValid = await verifyOtp(otp, user.otp);

  if (!isOtpValid || !user.otpExpiry || new Date(user.otpExpiry) < new Date()) {
    return sendResponse(res, false, genericErrorMsg, 400);
  }

  // Mark OTP as verified and remove it to prevent reuse
  await client
    .patch(user._id)
    .set({ otpVerified: true, otp: null, otpExpiry: null })
    .commit();

  return sendResponse(res, true, "OTP verified successfully");
});