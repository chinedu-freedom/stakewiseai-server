import { client } from "../../sanity.js";

/**
 * Validates if a user is eligible to invest in a specific plan.
 * Logic:
 * 1. Sufficient balance.
 * 2. Within plan deposit limits.
 */
export async function validateInvestmentEligibility(
  user,
  plan,
  amount,
  userId,
  planId
) {
  const balance = Number(user.accountBalance || 0);
  const min = Number(plan.minDeposit);
  const max = Number(plan.maxDeposit);
  const amt = Number(amount);

  // 1. Balance check (Deposit Balance only - profits cannot be invested)
  if (balance < amt) {
    return {
      success: false,
      message: "Insufficient deposit balance. Please make a deposit to invest (profits/earnings cannot be used to purchase investments).",
      status: 400,
    };
  }

  // 2. Plan limits check
  if (amt < min || amt > max) {
    return {
      success: false,
      message: `Amount must be between ${min} and ${max}`,
      status: 400,
    };
  }

  return {
    success: true,
    message: "Investment eligibility validated",
    status: 200,
  };
}