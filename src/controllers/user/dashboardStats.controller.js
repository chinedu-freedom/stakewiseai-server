import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { client } from "../../lib/sanity.js";

export const getDashboardStatsController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      accountBalance,
      totalProfit,
      reservedProfit
    }`,
    { userId }
  );

  if (!userData) {
    return sendResponse(res, false, "User not found", 404);
  }

  const availableProfit =
    (userData.totalProfit || 0) - (userData.reservedProfit || 0);

  const withdrawals = await client.fetch(
    `*[_type == "withdrawal" && user._ref == $userId && status == "successful"]{
      amount
    }`,
    { userId }
  );

  const totalWithdrawalAmount = withdrawals.reduce(
    (sum, w) => sum + (w.amount || 0),
    0
  );

  const investments = await client.fetch(
    `*[_type == "userInvestment" && user._ref == $userId]{
      amount
    }`,
    { userId }
  );

  const totalInvestmentAmount = investments.reduce(
    (sum, i) => sum + (i.amount || 0),
    0
  );

  return sendResponse(res, true, "Dashboard statistics fetched successfully", 200, {
    userDeposit: userData.accountBalance || 0,
    availableProfit,
    totalWithdrawalAmount,
    totalInvestmentAmount,
  });
});
