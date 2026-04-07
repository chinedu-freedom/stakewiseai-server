import { client } from "../../sanity.js";
import { v4 as uuid } from "uuid";

export async function createInvestmentRecord(
  user,
  plan,
  userId,
  planId,
  amount
) {
  try {
    const now = new Date();

    const contractEnd = new Date();
    contractEnd.setDate(now.getDate() + plan.contractDuration);

    const investmentId = uuid();

    const dailyProfitPercent = Number(plan.dailyProfit || 0);

    const newInvestment = {
      _id: investmentId,
      _type: "userInvestment",

      user: { _type: "reference", _ref: userId },
      plan: { _type: "reference", _ref: planId },

      amount: Number(amount),

      profitEarned: 0,

      status: "active",

      startDate: now.toISOString(),
      endDate: contractEnd.toISOString(),

      isLocked: plan.isFixedDeposit,

      totalWithdrawn: 0,

      lastCreditedAt: null,

      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // 🧠 FINANCIAL TRANSACTION (CRITICAL)
    const transaction = client.transaction();

    // 1. Create investment
    transaction.create(newInvestment);

    // 2. Deduct from user balance
    transaction.patch(userId, (patch) =>
      patch
        .dec({ accountBalance: Number(amount) })
        .inc({
          totalInvestment: Number(amount),
        })
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