import { client } from "../../sanity.js";
import { v4 as uuid } from "uuid";

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

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}