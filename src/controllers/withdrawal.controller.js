import { validateAndPrepareWithdrawal } from "../lib/helpers/withdrawal/validateAndPrepareWithdrawal.js";
import { sendResponse } from "../lib/response.js";
import { createWithdrawal } from "../lib/helpers/withdrawal/createWithdrawal.js";
import { client } from "../lib/sanity.js";
import { getPaginationParams, buildPaginationMeta } from "../lib/pagination.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getVipConfig } from "../lib/helpers/vip/getVipConfig.js";


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
  const vipConfig = await getVipConfig(userData.vipLevel);

  const now = new Date();
  const startOfDay = new Date(now).setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const stats = await client.fetch(
    `{
      "dailyCount": count(*[
        _type=="withdrawal" &&
        user._ref==$userId &&
        requestedAt >= $startOfDay
      ]),
      "dailyTotal": sum(*[
        _type=="withdrawal" &&
        user._ref==$userId &&
        requestedAt >= $startOfDay
      ].amount),
      "weeklyCount": count(*[
        _type=="withdrawal" &&
        user._ref==$userId &&
        requestedAt >= $startOfWeek
      ])
    }`,
    { 
      userId, 
      startOfDay: new Date(startOfDay).toISOString(),
      startOfWeek: startOfWeek.toISOString()
    }
  );

  const dailyCount = stats?.dailyCount || 0;
  const dailyTotal = stats?.dailyTotal || 0;
  const weeklyCount = stats?.weeklyCount || 0;

  const remainingDailyLimit = Math.max(
    0,
    (Number(vipConfig.dailyWithdrawalLimit) || 0) - dailyTotal
  );

  const remainingWeeklyCount = Math.max(
    0,
    (Number(vipConfig.maxWeeklyWithdrawals) || 0) - weeklyCount
  );

  return sendResponse(res, true, "Withdrawal limits fetched", 200, {
    vipLevel: vipConfig.name,
    minWithdrawal: vipConfig.minWithdrawal,
    maxWithdrawal: vipConfig.maxWithdrawal,
    maxDailyLimit: vipConfig.dailyWithdrawalLimit,
    maxDailyWithdrawals: vipConfig.maxDailyWithdrawals,
    maxWeeklyWithdrawals: vipConfig.maxWeeklyWithdrawals,

    dailyTotal,
    dailyCount,
    weeklyCount,
    remainingDailyLimit,
    remainingWeeklyCount,

    availableProfit,
  });
});