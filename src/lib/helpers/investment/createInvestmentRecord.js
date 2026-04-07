import { client } from "../../sanity.js";
import { v4 as uuid } from "uuid";

export async function createInvestmentRecord(
  userId,
  plan,
  planId,
  amount
) {
  try {
    const now = new Date();

    const endDate = new Date();
    endDate.setDate(now.getDate() + Number(plan.contractDuration));

    const investmentId = uuid();

    const newInvestment = {
      _id: investmentId,
      _type: "userInvestment",

      user: { _type: "reference", _ref: userId },
      plan: { _type: "reference", _ref: planId },

      amount: Number(amount),

      profitEarned: 0,
      totalWithdrawn: 0,

      status: "active",

      startDate: now.toISOString(),
      endDate: endDate.toISOString(),

      maturityStatus: "locked", // ✅ aligned with schema
      isFixedDeposit: !!plan.isFixedDeposit, // snapshot

lastCreditedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const transaction = client.transaction();

    transaction.create(newInvestment);

    transaction.patch(userId, (patch) =>
      patch
        .dec({ accountBalance: Number(amount) })
        .inc({ totalInvestment: Number(amount) })
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