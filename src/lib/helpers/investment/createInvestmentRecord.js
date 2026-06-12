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

    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        _id,
        accountBalance,
        totalProfit,
        reservedProfit,
        availableProfit
      }`,
      { userId }
    );

    if (!user) {
      return {
        success: false,
        error: "User not found during investment creation",
      };
    }

    const balance = Number(user.accountBalance || 0);
    const profit = Math.max(
      0,
      Number(
        user.availableProfit !== undefined
          ? user.availableProfit
          : Number(user.totalProfit || 0) - Number(user.reservedProfit || 0)
      )
    );

    const amt = Number(amount);
    let deductFromBalance = 0;
    let deductFromProfit = 0;

    if (balance >= amt) {
      deductFromBalance = amt;
    } else {
      deductFromBalance = balance;
      deductFromProfit = amt - balance;
    }

    const decFields = {};
    if (deductFromBalance > 0) {
      decFields.accountBalance = deductFromBalance;
    }
    if (deductFromProfit > 0) {
      decFields.totalProfit = deductFromProfit;
      if (user.availableProfit !== undefined) {
        decFields.availableProfit = deductFromProfit;
      }
    }

    const transaction = client.transaction();

    // ✅ 1. Create investment
    transaction.create(newInvestment);

    // ✅ 2. Deduct user balance
    transaction.patch(userId, (patch) => {
      let p = patch.setIfMissing({
        accountBalance: 0,
        totalInvestment: 0,
        totalProfit: 0,
        reservedProfit: 0,
        availableProfit: 0,
      });
      if (Object.keys(decFields).length > 0) {
        p = p.dec(decFields);
      }
      return p.inc({ totalInvestment: amt });
    });

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

      // ✅ Add money to referrer (Earnings Only)
      transaction.patch(p.user._id, (patch) =>
        patch
          .setIfMissing({ totalProfit: 0, availableProfit: 0, referralRewards: [] })
          .inc({ totalProfit: rewardAmount, availableProfit: rewardAmount })
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

