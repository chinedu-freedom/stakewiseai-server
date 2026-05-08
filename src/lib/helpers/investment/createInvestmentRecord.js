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

      maturityStatus: "locked",
      isFixedDeposit: !!plan.isFixedDeposit,

      lastCreditedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const transaction = client.transaction();

    // ✅ 1. Create investment
    transaction.create(newInvestment);

    // ✅ 2. Deduct user balance
    transaction.patch(userId, (patch) =>
      patch
        .setIfMissing({ accountBalance: 0, totalInvestment: 0 })
        .dec({ accountBalance: Number(amount) })
        .inc({ totalInvestment: Number(amount) })
    );

    /**
     * 🔥 3. REFERRAL PAYOUT LOGIC
     */
    // Fetch Referral Configuration
    const referralConfig = await client.fetch(`*[_type == "referralConfig"][0]`);
    const level1Percent = (referralConfig?.level1 || 10) / 100;
    const level2Percent = (referralConfig?.level2 || 5) / 100;
    const level3Percent = (referralConfig?.level3 || 1) / 100;

    const referralChain = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        referredBy->{
          _id,
          referredBy->{
            _id,
            referredBy->{
              _id
            }
          }
        }
      }`,
      { userId }
    );

    const level1 = referralChain?.referredBy;
    const level2 = level1?.referredBy;
    const level3 = level2?.referredBy;

    const payouts = [
      { user: level1, percent: level1Percent, level: 1 },
      { user: level2, percent: level2Percent, level: 2 },
      { user: level3, percent: level3Percent, level: 3 },
    ];

    for (const p of payouts) {
      if (!p.user?._id) continue;

      const rewardAmount = Number(amount) * p.percent;

      // ✅ Add money to referrer
      transaction.patch(p.user._id, (patch) =>
        patch
          .setIfMissing({ accountBalance: 0, totalProfit: 0, referralRewards: [] })
          .inc({ accountBalance: rewardAmount })
          .inc({ totalProfit: rewardAmount })
          .append("referralRewards", [
            {
              _key: uuid(),
              date: now.toISOString(),
              referredUser: { _type: "reference", _ref: userId },
              amount: rewardAmount,
              level: p.level,
              status: "approved",
            },
          ])
      );
    }

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

