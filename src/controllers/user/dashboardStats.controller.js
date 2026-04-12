import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { client } from "../../lib/sanity.js";

export const getDashboardStatsController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  // ✅ Fetch user financial data (single source of truth)
  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      accountBalance,
      totalProfit,
      reservedProfit,
      totalInvestment
    }`,
    { userId }
  );

  if (!userData) {
    return sendResponse(res, false, "User not found", 404);
  }

  const totalProfit = Number(userData.totalProfit || 0);
  const reservedProfit = Number(userData.reservedProfit || 0);

  const availableProfit = totalProfit - reservedProfit;

  // ✅ Only sum successful withdrawals
  const withdrawals = await client.fetch(
    `*[_type == "withdrawal" && user._ref == $userId && status == "successful"]{
      amount
    }`,
    { userId }
  );

  const totalWithdrawalAmount = withdrawals.reduce(
    (sum, w) => sum + (Number(w.amount) || 0),
    0
  );

  return sendResponse(
    res,
    true,
    "Dashboard statistics fetched successfully",
    200,
    {
      currentAssets: Number(userData.accountBalance || 0),
      totalStaked: Number(userData.totalInvestment || 0),
      totalCommission: totalProfit,
      commission: availableProfit, // Spendable
      totalWithdrawalAmount,
    }
  );
});