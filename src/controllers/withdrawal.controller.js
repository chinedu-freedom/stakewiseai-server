import { validateAndPrepareWithdrawal } from "../lib/helpers/withdrawal/validateAndPrepareWithdrawal.js";
import { sendResponse } from "../lib/response.js";
import { createWithdrawal } from "../lib/helpers/withdrawal/createWithdrawal.js";
import { client } from "../lib/sanity.js";
import { getPaginationParams, buildPaginationMeta } from "../lib/pagination.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { logUserActivity } from "../lib/logUserActivity.js";

export const createWithdrawalHandler = asyncHandler(async (req, res) => {
  const { user } = req; // attached by withAuth / withKycAuth

  const prep = await validateAndPrepareWithdrawal(req, user, res);
  if (prep?.error) return;

  const createdWithdrawal = await createWithdrawal(prep);

  logUserActivity(
    user._id,
    "Withdrawal Request",
    `Requested withdrawal of $${prep.amount} via ${prep.crypto}`,
    "info"
  ).catch(console.error);

  return sendResponse(
    res,
    true,
      "Withdrawal request submitted successfully. N/B: Withdrawal processing time is within 24 hours.",
    201,
    createdWithdrawal
  );
});


export const getWithdrawalsHandler = asyncHandler(async (req, res) => {
  // Pagination
  const { page, limit, start, end } = getPaginationParams(req);
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  // Total count
  const totalCount = await client.fetch(
    `count(*[_type == "withdrawal" && user._ref == $userId])`,
    { userId }
  );

  // Fetch withdrawals
  const withdrawals = await client.fetch(
    `*[_type == "withdrawal" && user._ref == $userId] 
      | order(requestedAt desc) 
      [${start}...${end}] {
        _id,
        requestedAt,
        amount,
        status,
        crypto,
        user -> {
          _id
        }
      }`,
    { userId }
  );

  const pagination = buildPaginationMeta(totalCount, page, limit);

  return sendResponse(res, true, "Withdrawals fetched successfully", 200, {
    withdrawals,
    pagination,
  });
});


export const getWithdrawalLimitsController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      totalProfit,
      reservedProfit,
      "availableProfit": coalesce(totalProfit, 0) - coalesce(reservedProfit, 0)
    }`,
    { userId }
  );

  if (!userData) {
    return sendResponse(res, false, "User not found", 404);
  }

  const availableProfit = Number(userData.availableProfit) || 0;
  const MIN_WITHDRAWAL = 15;
  const MAX_DAILY_WITHDRAWALS = 1;
  const WITHDRAWAL_FEE_PERCENT = 4;

  const now = new Date();
  const currentDay = now.getUTCDay();
  const allowedDays = [1, 3, 4]; // Monday, Wednesday, Thursday
  const isWithdrawalDay = allowedDays.includes(currentDay);
  const startOfDay = new Date(now).setHours(0, 0, 0, 0);

  const stats = await client.fetch(
    `{
      "dailyCount": count(*[
        _type=="withdrawal" &&
        user._ref==$userId &&
        requestedAt >= $startOfDay
      ])
    }`,
    { 
      userId, 
      startOfDay: new Date(startOfDay).toISOString()
    }
  );

  const dailyCount = stats?.dailyCount || 0;

  return sendResponse(res, true, "Withdrawal limits fetched", 200, {
    minWithdrawal: MIN_WITHDRAWAL,
    maxDailyWithdrawals: MAX_DAILY_WITHDRAWALS,
    withdrawalFeePercent: WITHDRAWAL_FEE_PERCENT,
    dailyCount,
    availableProfit,
    allowedDays,
    allowedDaysText: "Monday, Wednesday, Thursday",
    isWithdrawalDay,
  });
});