import { client } from "../../sanity.js";

/**
 * Validates if a user is eligible to invest in a specific plan.
 * Logic:
 * 1. Sufficient balance.
 * 2. Within plan deposit limits.
 * 3. Sequential progression (cannot skip plan levels).
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

  // 1. Balance check
  if (balance < amt) {
    return {
      success: false,
      message: "Insufficient balance. Please fund your wallet.",
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

  // 3. Prevent duplicate active investments in the SAME plan (Optional but often desired)
  // Check if user already has an active investment in THIS specific plan
  const existingSamePlanInvestment = await client.fetch(
    `*[_type == "userInvestment" && user._ref == $userId && plan._ref == $planId && status == "active"][0]`,
    { userId, planId }
  );

  if (existingSamePlanInvestment) {
    return {
      success: false,
      message: "You already have an active investment in this plan.",
      status: 400,
    };
  }

  // 4. Sequential Progression Check
  const currentPlanLevel = Number(plan.planLevel || 1);

  if (currentPlanLevel > 1) {
    // Check if the user has EVER had an investment in a plan with level = currentLevel - 1
    // We check for level - 1 to ensure they follow the sequence 1 -> 2 -> 3
    const previousLevelInvestment = await client.fetch(
      `*[_type == "userInvestment" && user._ref == $userId && plan->planLevel == $prevLevel][0]`,
      { 
        userId, 
        prevLevel: currentPlanLevel - 1 
      }
    );

    if (!previousLevelInvestment) {
      return {
        success: false,
        message: `You must invest in a Level ${currentPlanLevel - 1} plan before you can access this Level ${currentPlanLevel} plan.`,
        status: 403,
      };
    }
  }

  return {
    success: true,
    message: "Investment eligibility validated",
    status: 200,
  };
}