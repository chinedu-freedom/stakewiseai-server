import { client } from "../../sanity.js";

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

  // 💰 Balance check
  if (balance < amt) {
    return {
      success: false,
      message: "Insufficient balance. Please fund your wallet.",
      status: 400,
    };
  }

  // 📊 Plan limits check
  if (amt < min || amt > max) {
    return {
      success: false,
      message: `Amount must be between ${min} and ${max}`,
      status: 400,
    };
  }

  if (existingInvestment) {
    return {
      success: false,
      message: "You already have an active investment in this plan.",
      status: 400,
    };
  }

  // 📈 Hierarchical Level Check
  const currentPlanLevel = Number(plan.planLevel || 1);

  if (currentPlanLevel > 1) {
    // Check if the user has EVER had a successful or active investment in a plan with level < currentLevel
    // Specifically, we check for level = currentLevel - 1 to ensure they don't skip steps
    const previousLevelPlan = await client.fetch(
      `*[_type == "userInvestment" 
        && user._ref == $userId 
        && plan->planLevel == $prevLevel][0]`,
      { 
        userId, 
        prevLevel: currentPlanLevel - 1 
      }
    );

    if (!previousLevelPlan) {
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