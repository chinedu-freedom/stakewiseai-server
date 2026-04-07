import { client } from "../../sanity.js";

export async function validateInvestmentEligibility(
  user,
  plan,
  amount
) {
  const balance = Number(user.accountBalance || 0);
  const min = Number(plan.minDeposit);
  const max = Number(plan.maxDeposit);
  const amt = Number(amount);

  if (balance < amt) {
    return {
      success: false,
      message: "Insufficient balance. Please fund your wallet.",
      status: 400,
    };
  }

  if (amt < min || amt > max) {
    return {
      success: false,
      message: `Amount must be between ${min} and ${max}`,
      status: 400,
    };
  }

  // Prevent duplicate active investments
  const existingInvestment = await client.fetch(
    `*[_type == "userInvestment"
      && user._ref == $userId
      && plan._ref == $planId
      && status == "active"][0]`,
    {
      userId: user._id,
      planId: plan._id,
    }
  );

  if (existingInvestment) {
    return {
      success: false,
      message: "You already have an active investment in this plan.",
      status: 400,
    };
  }

  return {
    success: true,
    message: "Investment eligibility validated",
    status: 200,
  };
}