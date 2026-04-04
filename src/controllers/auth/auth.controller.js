import { client } from "../../lib/sanity.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { randomBytes, createHash } from "crypto";
import { addMinutes } from "date-fns";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "../../lib/mailer.js";
import { generateReferralCode } from "../../lib/generateReferralCode.js";
import { validateFields } from "../../lib/validateFields.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
import { sendResponse } from "../../lib/response.js";
import {
  comparePasswords,
  generateToken,
  hashPassword,
} from "../../lib/auth.js";

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
    authProvider: "email",
    isDeleted: false,
    tokenExpiresAt: addMinutes(new Date(), 10).toISOString(),
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
    return sendResponse(
      res,
      false,
      `Your account is ${user.accountStatus}`,
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
        ? "Verification link expired"
        : "Please verify your email",
      403
    );
  }

  const accessToken = generateToken(user._id, user.role, {
    expiresIn: keepMeLoggedIn ? "24h" : "1h",
  });

  res.cookie("token", accessToken, {
    httpOnly: true,
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