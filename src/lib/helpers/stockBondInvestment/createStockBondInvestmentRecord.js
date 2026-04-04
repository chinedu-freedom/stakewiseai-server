import { client } from "../../sanity.js";
import { v4 as uuid } from "uuid";
import { logUserActivity } from "../../logUserActivity.js";

export async function createStockBondInvestmentRecord(
  userId,
  planId,
  unitsHeld,
  totalCost
) {
  try {
    const now = new Date();

    // Fetch the plan to get contractDuration
    const plan = await client.fetch(`*[_type=="stockBondPlan" && _id==$planId][0]`, { planId });
    if (!plan) {
      return {
        success: false,
        message: "Stock/Bond plan not found",
        status: 404,
      };
    }

    // Calculate endDate based on contractDuration (in days)
    const endDate = new Date(now);
    if (plan.contractDuration && plan.contractDuration > 0) {
      endDate.setDate(now.getDate() + plan.contractDuration);
    }

    const investmentId = uuid();

    const newInvestment = {
      _id: investmentId,
      _type: "userInvestment",
      user: { _type: "reference", _ref: userId },
      plan: { _type: "reference", _ref: planId },
      planType: "stockBond",
      unitsHeld: Number(unitsHeld),
      amount: Number(totalCost),
      startDate: now.toISOString(),
      endDate: endDate.toISOString(), // NEW
      status: "active",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const transaction = client
      .transaction()
      .create(newInvestment)
      .patch(userId, (patch) =>
        patch.dec({ accountBalance: Number(totalCost) })
      );

    const result = await transaction.commit();

    await logUserActivity(
      userId,
      "Stock/Bond Investment Submitted",
      `Investment created successfully for plan ${planId}, amount ${totalCost}`,
      "success"
    );

    return {
      success: true,
      message: "Stock/Bond investment created successfully",
      status: 201,
      data: result,
    };
  } catch (error) {
    await logUserActivity(
      userId,
      "Stock/Bond Investment Failed",
      `Investment failed due to error: ${error.message}`,
      "failed"
    );

    return {
      success: false,
      message: "Failed to create stock/bond investment",
      status: 500,
      error: error.message,
    };
  }
}
