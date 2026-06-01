import { client } from "../lib/sanity.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import bcrypt from "bcryptjs";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail
} from "../lib/mailer.js";
import { generateReferralCode } from "../lib/generateReferralCode.js";
import { validateFields } from "../lib/validateFields.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sanitizeInput } from "../lib/sanitizeInput.js";
import { sendResponse } from "../lib/response.js";
import { addMinutes, isAfter } from "date-fns";
import crypto from "crypto";
import {
  hashOtp,
  comparePasswords,
  verifyOtp,
  generateToken,
  hashPassword
} from "../lib/auth.js";
import { findUserByEmail } from "../lib/findUserByEmail.js";
import { logUserActivity } from "../lib/logUserActivity.js";


export const register = asyncHandler(async (req, res) => {
  const sanitized = sanitizeInput(req.body);
  const {
    username,
    email,
    phoneNumber,
    countryCode,
    password,
    referralCode
  } = sanitized;

  const normalizedEmail = email?.trim().toLowerCase();

  const validationError = validateFields(
    ["username", "email", "phoneNumber", "password"],
    { username, email: normalizedEmail, phoneNumber, password }
  );

  if (validationError) {
    return sendResponse(res, false, validationError, 400);
  }

  let fullPhone;

  if (phoneNumber.startsWith("+")) {
    fullPhone = phoneNumber;
  } else {
    if (!countryCode) {
      return sendResponse(res, false, "Country code is required", 400);
    }

    if (!/^\+\d{1,4}$/.test(countryCode.trim())) {
      return sendResponse(res, false, "Invalid country code format", 400);
    }

    fullPhone = `${countryCode.trim()}${phoneNumber}`;
  }

  const parsedPhone = parsePhoneNumberFromString(fullPhone);

  if (!parsedPhone || !parsedPhone.isValid()) {
    return sendResponse(res, false, "Invalid phone number format", 400);
  }

  const formattedPhone = parsedPhone.format("E.164");
  const countryISO = parsedPhone.country;
  const countryCodeFinal = `+${parsedPhone.countryCallingCode}`;

  const existingUser = await client.fetch(
    `*[_type=="user" && (email==$email || phoneNumber==$phone || lower(username) == lower($username))][0]`,
    { email: normalizedEmail, phone: formattedPhone, username: username }
  );

  if (existingUser) {
    if (existingUser.username?.toLowerCase() === username.toLowerCase()) {
      return sendResponse(res, false, "Username already taken", 400);
    }
    return sendResponse(
      res,
      false,
      "Email or phone number already registered",
      400
    );
  }

  let referredBy = null;
  let referrerInfo = null;
  let referralLevel = 0;

  if (referralCode) {
    const ref = await client.fetch(
      `*[_type=="user" && referralCode==$code][0]{
        _id,
        username,
        email,
        referralCode,
        accountStatus,
        referralLevel
      }`,
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

    // ✅ Set level depth
    referralLevel = (ref.referralLevel || 0) + 1;

    referrerInfo = {
      _id: ref._id,
      username: ref.username,
      email: ref.email,
      referralCode: ref.referralCode,
    };

    // ✅ Increment referrer count (non-blocking safe update)
   client
  .patch(ref._id)
  .setIfMissing({ referralCount: 0 })
  .inc({ referralCount: 1 })
  .commit()
  .catch(console.error);
  }

  // Get IP
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const userData = {
    _type: "user",
    username,
    email: normalizedEmail,
    phoneNumber: formattedPhone,
    lastKnownIp: userIp,

    countryISO,
    countryCode: countryCodeFinal,

    password: await bcrypt.hash(password, Number(process.env.SALT_ROUNDS) || 10),

    referralCode: generateReferralCode(username),

    ...(referredBy && { referredBy }),

    referralLevel,

    emailVerified: true,
    accountStatus: "active",
    role: "user",

    totalProfit: 0,
    reservedProfit: 0,
    accountBalance: 0,
    availableProfit: 0,

    isDeleted: false,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newUser = await client.create(userData);

  // Send welcome email (non-blocking)
  sendWelcomeEmail({
    email: normalizedEmail,
    name: username,
  }).catch((err) => console.error("WELCOME_EMAIL_FAILED:", err));

  // Log activity
  logUserActivity(
    newUser._id,
    "Registration",
    "Account created successfully",
    "success",
    {
      ipAddress: userIp,
      userAgent: req.headers["user-agent"],
    }
  ).catch(console.error);

  return sendResponse(res, true, "Account created successfully", 201, {
    userId: newUser._id,
    email: newUser.email,
    accountStatus: newUser.accountStatus,
    referralCode: newUser.referralCode,
    referrer: referrerInfo,
  });
});

export const login = asyncHandler(async (req, res) => {
  const sanitized = sanitizeInput(req.body);

  const { email, password, keepMeLoggedIn } = sanitized;

  const normalizedEmail = email?.trim().toLowerCase();

  // Validate required fields
  const validationError = validateFields(
    ["email", "password"],
    { email: normalizedEmail, password }
  );

  if (validationError) {
    return sendResponse(res, false, validationError, 400);
  }

  const user = await findUserByEmail(normalizedEmail);

  // Prevent timing attacks
  const fakeHash =
    "$2b$10$CwTycUXWue0Thq9StjUM0uJ8G6k9y1p3uZP5KQJYl7t9v4RrR0e9y";

  const passwordMatch = await comparePasswords(
    password,
    user?.password || fakeHash
  );

  if (!user || !passwordMatch) {
    if (user) {
      logUserActivity(
        user._id,
        "Login Failed",
        "Invalid password attempt",
        "error"
      ).catch(console.error);
    }
    return sendResponse(res, false, "Invalid email or password", 401);
  }

  if (user.role !== "user") {
    return sendResponse(res, false, "Unauthorized access", 403);
  }

  const accessToken = generateToken(user._id, user.role, {
    expiresIn: keepMeLoggedIn ? "24h" : "1h",
  });

  // Get and update IP
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  client.patch(user._id).set({ lastKnownIp: userIp }).commit().catch(console.error);

  logUserActivity(
    user._id,
    "Login",
    "User logged in successfully",
    "success",
    {
      ipAddress: userIp,
      userAgent: req.headers["user-agent"],
    }
  ).catch(console.error);

  return sendResponse(res, true, "Login successful", 200, {
    userId: user._id,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    accountStatus: user.accountStatus,
    referralCode: user.referralCode,
    token: accessToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  // If we had a middleware setting req.user, we could log it here
  // For now, logout is simple. If we want to log, we need the userId.
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

  // Generate secure OTP (6-digit)
  const otp = crypto.randomInt(100000, 1000000).toString();

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

  logUserActivity(
    user._id,
    "OTP Requested",
    "Password reset OTP sent to email",
    "info"
  ).catch(console.error);

  return sendResponse(
    res,
    true,
    "If the account exists, an OTP has been sent"
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

  logUserActivity(
    user._id,
    "Password Reset",
    "Password successfully reset via OTP",
    "success"
  ).catch(console.error);

  return sendResponse(res, true, "Password reset successful");
});



export const verifyUserOtp = asyncHandler(async (req, res) => {
  const { email, otp } = sanitizeInput(req.body);

  if (!email || !otp) {
    return sendResponse(res, false, "Email and OTP are required", 400);
  }

  const user = await findUserByEmail(email);

  const genericErrorMsg = "Invalid credentials";

  if (!user || !user.otp || !user.otpExpiry) {
    return sendResponse(res, false, genericErrorMsg, 400);
  }

  // ⛔ CHECK EXPIRY FIRST
  if (new Date(user.otpExpiry) < new Date()) {
    return sendResponse(res, false, genericErrorMsg, 400);
  }

  const isOtpValid = await verifyOtp(otp, user.otp);

  if (!isOtpValid) {
    return sendResponse(res, false, genericErrorMsg, 400);
  }

  await client
    .patch(user._id)
    .set({
      otpVerified: true,
      otp: null,
      otpExpiry: null,
    })
    .commit();

  return sendResponse(res, true, "OTP verified successfully");
});