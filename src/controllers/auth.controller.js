import { client } from "../lib/sanity.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import bcrypt from "bcryptjs";
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordResetConfirmationEmail } from "../lib/mailer.js";
import { generateReferralCode } from "../lib/generateReferralCode.js";
import { validateFields } from "../lib/validateFields.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sanitizeInput } from "../lib/sanitizeInput.js";
import { sendResponse } from "../lib/response.js";
import { findUserByEmail } from "../lib/findUserByEmail.js";
import {
  comparePasswords,
  generateToken,
  hashPassword,
  hashOtp,
  verifyOtp,
} from "../lib/auth.js";
import { addMinutes, isAfter } from "date-fns";
import { createHash, randomBytes } from "crypto";
import crypto from "crypto";




export const register = asyncHandler(async (req, res) => {
  const sanitized = sanitizeInput(req.body);

  const { username, email, phoneNumber, password, referralCode } = sanitized;

  const normalizedEmail = email?.trim().toLowerCase();

  // Validate required fields
  const validationError = validateFields(
    ["username", "email", "phoneNumber", "password"],
    { username, email: normalizedEmail, phoneNumber, password }
  );

  if (validationError) {
    return sendResponse(res, false, validationError, 400);
  }

  // Validate & format phone
  const parsedPhone = parsePhoneNumberFromString(phoneNumber);
  if (!parsedPhone || !parsedPhone.isValid()) {
    return sendResponse(res, false, "Invalid phone number format", 400);
  }

  const formattedPhone = parsedPhone.format("E.164");

  // Prevent duplicate email OR phone
  const existingUser = await client.fetch(
    `*[_type=="user" && (email==$email || phoneNumber==$phone)][0]`,
    { email: normalizedEmail, phone: formattedPhone }
  );

  if (existingUser) {
    return sendResponse(
      res,
      false,
      "Email or phone number already registered",
      400
    );
  }

  let referredBy = null;
  let referrerInfo = null;

  if (referralCode) {
    const ref = await client.fetch(
      `*[_type=="user" && referralCode==$code][0]`,
      { code: referralCode.toUpperCase() }
    );

    if (!ref) {
      return sendResponse(res, false, "Invalid referral code", 400);
    }

    if (ref.accountStatus !== "active") {
      return sendResponse(
        res,
        false,
        "Referrer must have an active account",
        400
      );
    }

    referredBy = { _ref: ref._id, _type: "reference" };

    referrerInfo = {
      _id: ref._id,
      username: ref.username,
      email: ref.email,
      referralCode: ref.referralCode,
    };
  }

  // Token generation
  const rawToken = randomBytes(32).toString("hex");
  const tokenDigest = createHash("sha256").update(rawToken).digest("hex");

  const verificationToken = await bcrypt.hash(
    rawToken,
    Number(process.env.SALT_ROUNDS) || 10
  );

  // Create user
  const newUser = await client.create({
    _type: "user",
    username,
    email: normalizedEmail,
    phoneNumber: formattedPhone,
    password: await hashPassword(password),
    referralCode: generateReferralCode(username),
    referredBy,
    referrerId: referralCode || null,
    emailVerified: false,
    accountStatus: "pending",
    tokenDigest,
    verificationToken,
    role: "user",
    tokenExpiresAt: addMinutes(new Date(), 10).toISOString(),
    createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  });

  // Send email
  const emailResult = await sendVerificationEmail({
    email: normalizedEmail,
    name: username,
    token: rawToken,
  });

  if (!emailResult?.success) {
    return sendResponse(
      res,
      false,
      "Account created but verification email could not be sent.",
      500
    );
  }

  return sendResponse(res, true, "Verification email sent", 201, {
    userId: newUser._id,
    email: newUser.email,
    accountStatus: newUser.accountStatus,
    referralCode: newUser.referralCode,
    referrer: referrerInfo,
  });
});

export const login = asyncHandler(async (req, res) => {
  const sanitized = sanitizeInput(req.body);

  const { phoneNumber, password, keepMeLoggedIn } = sanitized;

  // Validate required fields
  const validationError = validateFields(
    ["phoneNumber", "password"],
    { phoneNumber, password }
  );

  if (validationError) {
    return sendResponse(res, false, validationError, 400);
  }

  // Normalize phone
  const parsedPhone = parsePhoneNumberFromString(phoneNumber);
  if (!parsedPhone || !parsedPhone.isValid()) {
    return sendResponse(res, false, "Invalid phone number", 400);
  }

  const formattedPhone = parsedPhone.format("E.164");

  // Find user
  const user = await client.fetch(
    `*[_type=="user" && phoneNumber==$phone][0]`,
    { phone: formattedPhone }
  );

  // Prevent timing attacks
  const fakeHash =
    "$2b$10$CwTycUXWue0Thq9StjUM0uJ8G6k9y1p3uZP5KQJYl7t9v4RrR0e9y";

  const passwordMatch = await comparePasswords(
    password,
    user?.password || fakeHash
  );

  if (!user || !passwordMatch) {
    return sendResponse(res, false, "Invalid phone number or password", 401);
  }

  if (user.role !== "user") {
    return sendResponse(
      res,
      false,
      "Unauthorized access",
      403
    );
  }

if (user.accountStatus !== "active") {
  if (user.accountStatus === "pending") {
    return sendResponse(
      res,
      false,
      "Your account is pending. Please verify your email.",
      403
    );
  }

  if (user.accountStatus === "suspended") {
    return sendResponse(
      res,
      false,
      "Your account has been suspended. Please contact support.",
      403
    );
  }

  return sendResponse(
    res,
    false,
    `Your account is ${user.accountStatus}. Please contact support.`,
    403
  );
}

  if (!user.emailVerified) {
    const tokenExpired =
      user.tokenExpiresAt && new Date(user.tokenExpiresAt) < new Date();

    return sendResponse(
      res,
      false,
      tokenExpired
        ? "Verification link expired, please request a new verification link"
        : "Your email is not verified. Please verify your email",
      403
    );
  }

  const accessToken = generateToken(user._id, user.role, {
    expiresIn: keepMeLoggedIn ? "24h" : "1h",
  });

  res.cookie("token", accessToken, {
    httpOnly: true,
    // secure: false,
    // sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: keepMeLoggedIn ? 86400000 : 3600000,
  });

  return sendResponse(res, true, "Login successful", 200, {
    userId: user._id,
    username: user.username,
    phoneNumber: user.phoneNumber,
    role: user.role,
    accountStatus: user.accountStatus,
    referralCode: user.referralCode,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
    path: "/",
  });

  return sendResponse(res, true, "Logout successful", 200);
});


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