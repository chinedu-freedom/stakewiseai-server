import { validateAndPrepareWithdrawal } from "../lib/helpers/withdrawal/validateAndPrepareWithdrawal.js";
import { sendResponse } from "../lib/response.js";
import { createWithdrawal } from "../lib/helpers/withdrawal/createWithdrawal.js";
import { client } from "../lib/sanity.js";
import { getPaginationParams, buildPaginationMeta } from "../lib/pagination.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const MIN_WITHDRAWAL = 20;
const MAX_WITHDRAWAL = 100;
const DAILY_WITHDRAWAL_LIMIT = 100;
const MAX_DAILY_WITHDRAWALS = 5;


export const createWithdrawalHandler = asyncHandler(async (req, res) => {
  const { user } = req; // attached by withAuth / withKycAuth

  const prep = await validateAndPrepareWithdrawal(req, user, res);
  if (prep?.error) return;

  const createdWithdrawal = await createWithdrawal(prep);

  return sendResponse(
    res,
    true,
    "Withdrawal request submitted successfully and is pending approval.",
    201,
    createdWithdrawal
  );
});


export const getWithdrawalsHandler = asyncHandler(async (req, res) => {
  // Pagination
  const { page, limit, start, end } = getPaginationParams(req);

  // Total count
  const totalCount = await client.fetch(
    `count(*[_type == "withdrawal"])`
  );

  // Fetch withdrawals
  const withdrawals = await client.fetch(
    `*[_type == "withdrawal"] 
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
      }`
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

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyData = await client.fetch(
    `{
      "count": count(*[
        _type=="withdrawal" &&
        user._ref==$userId &&
        requestedAt >= $startOfDay
      ]),
      "total": sum(*[
        _type=="withdrawal" &&
        user._ref==$userId &&
        requestedAt >= $startOfDay
      ].amount)
    }`,
    { userId, startOfDay: startOfDay.toISOString() }
  );

  const dailyCount = dailyData?.count || 0;
  const dailyTotal = dailyData?.total || 0;

  const remainingDailyLimit = Math.max(
    0,
    DAILY_WITHDRAWAL_LIMIT - dailyTotal
  );

  return sendResponse(res, true, "Withdrawal limits fetched", 200, {
    minWithdrawal: MIN_WITHDRAWAL,
    maxWithdrawal: MAX_WITHDRAWAL,
    maxDailyLimit: DAILY_WITHDRAWAL_LIMIT,
    maxDailyWithdrawals: MAX_DAILY_WITHDRAWALS,

    dailyTotal,
    dailyCount,
    remainingDailyLimit,

    availableProfit,
  });
});