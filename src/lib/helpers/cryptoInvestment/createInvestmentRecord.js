import { client } from "../../sanity.js";
import { v4 as uuid } from "uuid";
import { logUserActivity } from "../../logUserActivity.js";

export async function createInvestmentRecord(
  userId,
  planId,
  planType,
  amount,
  contractDuration
) {
  try {
    const now = new Date();
    const contractEnd = new Date(
      now.getTime() + contractDuration * 24 * 60 * 60 * 1000
    );

    const investmentId = uuid();

    const newInvestment = {
      _id: investmentId,
      _type: "userInvestment",
      user: { _type: "reference", _ref: userId },
      plan: { _type: "reference", _ref: planId },
      planType,
      amount,
      expectedROI: 0,
      startDate: now.toISOString(),
      endDate: contractEnd.toISOString(),
      status: "active",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const transaction = client
      .transaction()
      .create(newInvestment)
      .patch(userId, (patch) =>
        patch.dec({ accountBalance: Number(amount) })
      );

    const result = await transaction.commit();

    await logUserActivity(
      userId,
      "Crypto Investment Submitted",
      `Investment created successfully for plan ${planId} with amount ${amount}`,
      "success"
    );

    // Return plain object instead of calling sendResponse
    return { success: true, data: result };
  } catch (error) {
    await logUserActivity(
      userId,
      "Crypto Investment Failed",
      `Investment failed due to error: ${error.message}`,
      "failed"
    );

    // Return plain object with error info
    return { success: false, error: error.message };
  }
}
