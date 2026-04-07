import crypto from "crypto";

export function generateReferralCode(name) {
  const random = crypto.randomInt(1000, 10000); // stronger than Math.random()
  const cleanedName = name
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 5);

  return `${cleanedName}${random}`;
}


