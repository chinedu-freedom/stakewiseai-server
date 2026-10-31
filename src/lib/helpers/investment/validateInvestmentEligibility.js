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
  const profit = Math.max(
    0,
    Number(
      user.availableProfit !== undefined
        ? user.availableProfit
        : Number(user.totalProfit || 0) - Number(user.reservedProfit || 0)
    )
  );
  const totalAvailable = balance + profit;
  const min = Number(plan.minDeposit);
  const max = Number(plan.maxDeposit);
  const amt = Number(amount);

  // 1. Balance check
  if (totalAvailable < amt) {
    return {
      success: false,
      message: "Insufficient balance. Please fund your wallet or use your profit balance.",
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