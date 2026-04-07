import cron from "node-cron";
import { client } from "../lib/sanity.js";

export const startInvestmentScheduler = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("Running investment profit scheduler...");

    try {
      const now = new Date();

      const activeInvestments = await client.fetch(
        `*[_type=="userInvestment" && status=="active"]{
          _id,
          profitEarned,
          expectedROI,
          startDate,
          endDate,
          lastCreditedAt,
          planType,
          amount,
          unitsHeld,
          user->{ _id, userName, totalProfit },
          plan->{
            contractDuration,
            dailyProfit,
            changePercent,
            currentPrice,
            roiEstimate,
            interestAmount
          }
        }`
      );

      for (const inv of activeInvestments) {
        const {
          _id,
          user,
          plan,
          amount,
          unitsHeld,
          expectedROI,
          profitEarned = 0,
          startDate,
          endDate,
          lastCreditedAt,
          planType,
        } = inv;

        if (!user || !plan) continue;

        const lastCredit = lastCreditedAt
          ? new Date(lastCreditedAt)
          : new Date(startDate);

        const hoursElapsed = Math.floor(
          (now - lastCredit) / (1000 * 60 * 60)
        );

        if (hoursElapsed < 1) continue;

        let hourlyProfit = 0;
const totalHours =
  (plan.contractDuration || 1) * 24;

        switch (planType) {
          case "crypto":
            hourlyProfit =
              ((amount || 0) * (plan.dailyProfit || 0)) / 100 / 24;
            break;

          case "realEstate":
            // hourlyProfit =
            //   ((amount || 0) * (plan.roiEstimate || 0)) /
            //   100 /
            //   ((plan.contractDuration || 1) * 24);
            hourlyProfit =
  ((amount || 0) * (plan.roiEstimate || 0)) /
  100 /
  totalHours;
            break;

          case "stockBond":
            const totalPlanProfit =
              (unitsHeld || 0) *
              (plan.currentPrice || 0) *
              ((plan.changePercent || 0) / 100);

            hourlyProfit =
              totalPlanProfit /
              ((plan.contractDuration || 1) * 24);
            break;

          case "loan":
            hourlyProfit =
              (plan.interestAmount || 0) /
              ((plan.contractDuration || 1) * 24);
            break;

          default:
            continue;
        }

        let profitToCredit =
          Math.round(hourlyProfit * hoursElapsed * 100) / 100;

        const maxProfit = expectedROI || Infinity;
        const remainingProfit = maxProfit - profitEarned;

        if (remainingProfit <= 0) {
          await client.patch(_id).set({ status: "completed" }).commit();
          continue;
        }

        if (profitToCredit > remainingProfit) {
          profitToCredit = remainingProfit;
        }

        const newLastCredit = new Date(
          lastCredit.getTime() + hoursElapsed * 60 * 60 * 1000
        ).toISOString();

        // 🔒 ATOMIC CREDIT
        await client
          .transaction()
          .patch(user._id, {
            setIfMissing: { totalProfit: 0 },
            inc: { totalProfit: profitToCredit },
          })
          .patch(_id, {
            setIfMissing: { profitEarned: 0 },
            inc: { profitEarned: profitToCredit },
            set: { lastCreditedAt: newLastCredit },
          })
          .commit();

        // Final completion check
        if (
          profitEarned + profitToCredit >= maxProfit ||
          now >= new Date(endDate)
        ) {
          await client.patch(_id).set({ status: "completed" }).commit();
        }

        console.log(
          `Credited ${profitToCredit.toFixed(2)} to ${user.userName} (Investment ${_id})`
        );
      }
    } catch (err) {
      console.error("Investment profit scheduler error:", err);
    }
  });
};
