import { client } from "../../sanity.js";

export async function validateStockBondInvestmentEligibility(
  user,
  plan,
  userId,
  planId
) {
  const unitsHeld = Number(plan.unitHeld);
  const currentPrice = Number(plan.currentPrice);
  const totalCost = unitsHeld * currentPrice;

  const userBalance = Number(user.accountBalance || 0);

  if (userBalance < totalCost) {
    return {
      success: false,
      message: "Insufficient balance. Please fund your wallet.",
      status: 400,
    };
  }

  const existingInvestment = await client.fetch(
    `*[_type=="userInvestment"
      && user._ref==$userId
      && plan._ref==$planId
      && status in ["active","pending"]
    ][0]`,
    { userId, planId }
  );

  if (existingInvestment) {
    return {
      success: false,
      message:
        "You already have an active or pending investment in this plan. Please wait for it to complete.",
      status: 400,
    };
  }

  return {
    success: true,
    message: "Investment eligibility validated",
    status: 200,
    data: { unitsHeld, totalCost },
  };
}
