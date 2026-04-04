import { client } from "../../sanity.js";
import { v4 as uuid } from "uuid";
import { logUserActivity } from "../../logUserActivity.js";

export async function createRealEstateInvestmentRecord(
  userId,
  planId,
  amount,
  plan
) {
  try {
    const now = new Date();

    // Calculate endDate based on contractDuration in DAYS
    const endDate = new Date(now);
    if (plan.contractDuration && plan.contractDuration > 0) {
      endDate.setDate(now.getDate() + Number(plan.contractDuration));
    }

    const expectedROI = (Number(amount) * Number(plan.roiEstimate)) / 100;

    const newInvestment = await client.create({
      _id: uuid(),
      _type: "userInvestment",
      user: { _type: "reference", _ref: userId },
      plan: { _type: "reference", _ref: planId },
      planType: "realEstate",
      amount: Number(amount),
      expectedROI,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(), // updated to use days
      status: "active",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    await client.patch(userId).dec({ accountBalance: Number(amount) }).commit();

    await logUserActivity(
      userId,
      "Real Estate Investment Submitted",
      `Created real estate investment in plan ${planId} for amount ${amount}`,
      "success"
    );

    return {
      success: true,
      message: "Investment created successfully",
      status: 201,
      data: newInvestment,
    };
  } catch (error) {
    console.error("❌ createRealEstateInvestmentRecord error:", error);

    await logUserActivity(
      userId,
      "Real Estate Investment Failed",
      `Failed to create investment: ${error.message}`,
      "failed"
    );

    return {
      success: false,
      message: "Failed to create investment",
      status: 500,
      error: error.message,
    };
  }
}
