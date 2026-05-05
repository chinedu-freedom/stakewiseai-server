import { client } from "../../sanity.js";

export async function getUserAndPlan(userId, planId) {
  const [user, plan] = await Promise.all([
    client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        _id,
        accountBalance
      }`,
      { userId }
    ),
    client.fetch(
      `*[_type == "plan" && _id == $planId && status == "active"][0]{
        _id,
        title,
        minDeposit,
        maxDeposit,
        dailyProfit,
        contractDuration,
        isFixedDeposit,
        planLevel
      }`,
      { planId }
    ),
  ]);

  if (!user) {
    return {
      success: false,
      message: "User not found",
      status: 404,
    };
  }

  if (!plan) {
    return {
      success: false,
      message: "Plan not found or inactive",
      status: 404,
    };
  }

  return {
    success: true,
    data: { user, plan },
  };
}