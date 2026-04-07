import cron from "node-cron";
import { client } from "../lib/sanity.js";

export const startInvestmentScheduler = () => {
  // Runs every 24 hours (midnight)
  cron.schedule("0 0 * * *", async () => {
    console.log("Running DAILY investment profit scheduler...");

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

        if (!user || !plan) continue;

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

        // 🔄 Build dynamic profit updates
        let userUpdate = {
          totalProfit: dailyProfit,
        };

        if (isFixedDeposit) {
          if (isMatured) {
            // ✅ Once matured → move to available
            userUpdate.availableProfit = dailyProfit;
          } else {
            // 🔒 Still locked → keep in reserved
            userUpdate.reservedProfit = dailyProfit;
          }
        } else {
          // ✅ Flexible → always available
          userUpdate.availableProfit = dailyProfit;
        }

        // 💰 ATOMIC UPDATE
        await client
          .transaction()
          .patch(_id, (patch) =>
            patch
              .inc({ profitEarned: dailyProfit })
              .set({ lastCreditedAt: now.toISOString() })
          )
          .patch(user._id, (patch) =>
            patch.inc(userUpdate)
          )
          .commit();

        // 🏁 HANDLE MATURITY
        if (isMatured) {
          await client
            .patch(_id)
            .set({
              status: "completed",
              maturityStatus: "matured",
            })
            .commit();
        }

        console.log(
          `Credited ${dailyProfit.toFixed(2)} to user ${user._id} (Investment ${_id})`
        );
      }
    } catch (err) {
      console.error("Investment scheduler error:", err);
    }
  });
};