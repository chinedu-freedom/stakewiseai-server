import { client } from "../../sanity.js";

export async function getUserAndStockBondPlan(userId, planId) {
  const [user, plan] = await Promise.all([
    client.fetch(
      `*[_type=="user" && _id==$userId][0]{
        _id,
        accountBalance,
        name,
        email
      }`,
      { userId }
    ),
    client.fetch(
      `*[_type=="stockBondPlan" && _id==$planId && status=="active"][0]{
        _id,
        title,
        type,
        unitHeld,
        currentPrice,
        changePercent
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
      message: "Stock/Bond plan not found",
      status: 404,
    };
  }

  return {
    success: true,
    message: "User and plan fetched successfully",
    status: 200,
    data: { user, plan },
  };
}
