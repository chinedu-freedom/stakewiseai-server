import cron from "node-cron";
import { client } from "../lib/sanity.js";

export const startInvestmentScheduler = () => {
  // Runs every hour to check for 24-hour maturity for each investment
  cron.schedule("0 * * * *", async () => {
    console.log("Running hourly investment profit scheduler...");

    try {
      const now = new Date();

      const activeInvestments = await client.fetch(`
        *[_type=="userInvestment" && status=="active"]{
          _id,
          amount,
          profitEarned,
          lastCreditedAt,
          startDate,
          endDate,
          isFixedDeposit,
          maturityStatus,
          user->{_id},
          plan->{ dailyProfit }
        }
      `);

      for (const inv of activeInvestments) {
        const {
          _id,
          user,
          plan,
          amount,
          profitEarned = 0,
          lastCreditedAt,
          startDate,
          endDate,
          isFixedDeposit,
        } = inv;

        if (!user?._id || !plan) continue;

        const lastCredit = lastCreditedAt
          ? new Date(lastCreditedAt)
          : new Date(startDate);

        const hoursElapsed = Math.floor(
          (now - lastCredit) / (1000 * 60 * 60)
        );

        // Only run once every 24h
        if (hoursElapsed < 24) continue;

        // 🔢 DAILY PROFIT CALCULATION
        const dailyProfit =
          ((Number(amount) || 0) * (Number(plan.dailyProfit) || 0)) / 100;

        const isMatured = now >= new Date(endDate);

        // 🔄 Build dynamic updates
        const transaction = client.transaction();

        // 1. Update Investment Document
        const investmentUpdate = {
          profitEarned: (Number(profitEarned) || 0) + dailyProfit,
          lastCreditedAt: now.toISOString(),
        };

        if (isMatured) {
          investmentUpdate.status = "completed";
          investmentUpdate.maturityStatus = "matured";
          investmentUpdate.updatedAt = now.toISOString();
        }

        transaction.patch(_id, (patch) => patch.set(investmentUpdate));

        // 2. Update User Financials
        const userPatch = {
          totalProfit: dailyProfit,
        };

        if (isFixedDeposit) {
          if (isMatured) {
            /** 
             * 🔓 MATURITY UNLOCK:
             * Move entire accumulated profit (including today's) to availableProfit
             * and clear it from reservedProfit.
             */
            userPatch.availableProfit = (Number(profitEarned) || 0) + dailyProfit;
            userPatch.reservedProfit = -(Number(profitEarned) || 0); 
          } else {
            // 🔒 STILL LOCKED: Add only to reserved
            userPatch.reservedProfit = dailyProfit;
          }
        } else {
          // ✅ FLEXIBLE: Always goes to available
          userPatch.availableProfit = dailyProfit;
        }

        transaction.patch(user._id, (patch) =>
          patch
            .setIfMissing({ 
              totalProfit: 0, 
              availableProfit: 0, 
              reservedProfit: 0 
            })
            .inc(userPatch)
        );

        await transaction.commit();

        console.log(
          `[SCHEDULER] Credited ${dailyProfit.toFixed(2)} to user ${user._id} | Inv: ${_id} | Matured: ${isMatured}`
        );
      }
    } catch (err) {
      console.error("Investment scheduler error:", err);
    }
  });
};