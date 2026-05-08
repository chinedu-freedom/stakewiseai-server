import { client } from "../../sanity.js";
import { sendResponse } from "../../response.js";
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
      "availableProfit": coalesce(availableProfit, coalesce(totalProfit, 0) - coalesce(reservedProfit, 0))
    }`,
    { userId }
  );

  if (!userData) {
    sendResponse(res, false, "User not found", 404);
    return { error: true };
  }

  const MIN_WITHDRAWAL = 20;
  const MAX_WITHDRAWAL = 100;
  const DAILY_WITHDRAWAL_LIMIT = 100;
  const MAX_DAILY_WITHDRAWALS = 5;
  const MAX_WEEKLY_WITHDRAWALS = 20;

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

  const now = new Date();
  const startOfDay = new Date(now).setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7); // Rolling 7 days

  const withdrawalStats = await client.fetch(
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

  const { dailyCount, dailyTotal, weeklyCount } = withdrawalStats;

  if (dailyCount >= MAX_DAILY_WITHDRAWALS) {
    sendResponse(res, false, `Daily withdrawal count exceeded (${MAX_DAILY_WITHDRAWALS} allowed)`, 400);
    return { error: true };
  }

  if (dailyTotal + parsedAmount > DAILY_WITHDRAWAL_LIMIT) {
    sendResponse(res, false, `Daily withdrawal limit exceeded ($${DAILY_WITHDRAWAL_LIMIT} allowed)`, 400);
    return { error: true };
  }

  if (weeklyCount >= MAX_WEEKLY_WITHDRAWALS) {
    sendResponse(res, false, `Weekly withdrawal count exceeded (${MAX_WEEKLY_WITHDRAWALS} allowed)`, 400);
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
