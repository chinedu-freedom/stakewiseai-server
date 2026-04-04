import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = process.env.SALT_ROUNDS;

if (!JWT_SECRET || !SALT_ROUNDS) {
  throw new Error("JWT_SECRET and SALT_ROUNDS must be set");
}

  // Hash otp
  export async function hashOtp(otp) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
}

// Verify otp
export async function verifyOtp(plainOtp, hashedOtp) {
  return await bcrypt.compare(plainOtp, hashedOtp);
}

// Hash a plain password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 
    Number(SALT_ROUNDS || 10)
  );
}

// Compare a plain password with a hashed password
export async function comparePasswords(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}


// Access token (short-lived)
export function generateToken(userId, role = "user", options = {}) {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: options.expiresIn || "1h" } // default 1 hour
  );
}
// Verify token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}