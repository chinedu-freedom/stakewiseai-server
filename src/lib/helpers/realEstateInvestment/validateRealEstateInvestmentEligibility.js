import { client } from "../../../lib/sanity.js";

export async function validateRealEstateInvestmentEligibility(
  user,
  plan,
  amount,
  userId,
  planId
) {
  const balance = Number(user?.accountBalance || 0);
  const minInvestment = Number(plan?.minInvestment || 0);
  const investmentAmount = Number(amount);

  if (balance < investmentAmount) {
    return {
      success: false,
      message: "Insufficient balance. Please fund your wallet.",
      status: 400,
    };
  }

  if (investmentAmount < minInvestment) {
    return {
      success: false,
      message: `Amount must be at least ${minInvestment}`,
      status: 400,
    };
  }

  const existingInvestment = await client.fetch(
    `*[_type=="userInvestment"
      && user._ref==$userId
      && plan._ref==$planId
      && status=="active"][0]`,
    { userId, planId }
  );

  if (existingInvestment) {
    return {
      success: false,
      message:
        "You already have an active investment in this plan. Please wait for it to complete.",
      status: 400,
    };
  }

  return {
    success: true,
    message: "Investment eligibility validated",
    status: 200,
    data: {
      amount: investmentAmount,
      minInvestment,
      accountBalance: balance,
    },
  };
}
