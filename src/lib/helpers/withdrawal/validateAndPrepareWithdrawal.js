import { client } from "../../sanity.js";
import { sendResponse } from "../../response.js";
import { getVipConfig } from "../vip/getVipConfig.js";

export async function validateAndPrepareWithdrawal(req, user, res) {
  const userId = user?.userId;

  if (!userId) {
    sendResponse(res, false, "Unauthorized", 401);
    return { error: true };
  }

  const { amount, walletAddress } = req.body;

  const wallet = walletAddress?.trim();
  const parsedAmount = Number(amount);

  if (!wallet) {
    sendResponse(res, false, "Wallet address is required", 400);
    return { error: true };
  }

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    sendResponse(res, false, "Invalid withdrawal amount", 400);
    return { error: true };
  }

  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      _id,
      username,
      email,
      totalProfit,
      reservedProfit,
      vipLevel,
      "availableProfit": coalesce(availableProfit, coalesce(totalProfit, 0) - coalesce(reservedProfit, 0))
    }`,
    { userId }
  );

  if (!userData) {
    sendResponse(res, false, "User not found", 404);
    return { error: true };
  }

  const vipConfig = await getVipConfig(userData.vipLevel);

  const MIN_WITHDRAWAL = vipConfig.minWithdrawal;
  const MAX_WITHDRAWAL = vipConfig.maxWithdrawal;
  const DAILY_WITHDRAWAL_LIMIT = vipConfig.dailyWithdrawalLimit;
  const MAX_DAILY_WITHDRAWALS = vipConfig.maxDailyWithdrawals;

  if (parsedAmount < MIN_WITHDRAWAL) {
    sendResponse(res, false, `Minimum withdrawal is $${MIN_WITHDRAWAL}`, 400);
    return { error: true };
  }

  if (parsedAmount > MAX_WITHDRAWAL) {
    sendResponse(res, false, `Maximum withdrawal is $${MAX_WITHDRAWAL}`, 400);
    return { error: true };
  }

  const availableProfit = Number(userData.availableProfit) || 0;

  if (availableProfit < parsedAmount) {
    sendResponse(res, false, "Insufficient available profit", 400);
    return { error: true };
  }

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

  if (dailyCount >= MAX_DAILY_WITHDRAWALS) {
    sendResponse(res, false, "Daily withdrawal count exceeded", 400);
    return { error: true };
  }

  if (dailyTotal + parsedAmount > DAILY_WITHDRAWAL_LIMIT) {
    sendResponse(res, false, "Daily withdrawal limit exceeded", 400);
    return { error: true };
  }

  const pending = await client.fetch(
    `count(*[_type=="withdrawal" && user._ref==$userId && status=="pending"])`,
    { userId }
  );

  if (pending > 0) {
    sendResponse(res, false, "You already have a pending withdrawal", 400);
    return { error: true };
  }

  return {
    userId,
    userData,
    amount: parsedAmount,
    wallet,
  };
}
