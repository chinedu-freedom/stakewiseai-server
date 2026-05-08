import { client } from "../../sanity.js";
import { sendResponse } from "../../response.js";

export async function validateAndPrepareWithdrawal(req, user, res) {
  const userId = user?.userId;

  if (!userId) {
    sendResponse(res, false, "Unauthorized", 401);
    return { error: true };
  }

  const { amount, walletAddress, crypto } = req.body;

  const wallet = walletAddress?.trim();
  const parsedAmount = Number(amount);
  const selectedCrypto = crypto?.toUpperCase();

  if (!wallet) {
    sendResponse(res, false, "Wallet address is required", 400);
    return { error: true };
  }

  if (!selectedCrypto || !['USDT', 'BTC', 'ETH', 'BNB', 'TRX'].includes(selectedCrypto)) {
    sendResponse(res, false, "A valid crypto asset must be selected", 400);
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
  const MAX_DAILY_WITHDRAWALS = 1;
  const WITHDRAWAL_FEE_PERCENT = 0.06; // 6%

  if (parsedAmount < MIN_WITHDRAWAL) {
    sendResponse(res, false, `Minimum withdrawal is $${MIN_WITHDRAWAL}`, 400);
    return { error: true };
  }

  const availableProfit = Number(userData.availableProfit) || 0;

  if (availableProfit < parsedAmount) {
    sendResponse(res, false, "Insufficient available profit", 400);
    return { error: true };
  }

  const now = new Date();
  const startOfDay = new Date(now).setHours(0, 0, 0, 0);

  const withdrawalStats = await client.fetch(
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

  const { dailyCount } = withdrawalStats;

  if (dailyCount >= MAX_DAILY_WITHDRAWALS) {
    sendResponse(res, false, `You have already made a withdrawal today. Only ${MAX_DAILY_WITHDRAWALS} withdrawal per day is allowed.`, 400);
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

  // Calculate Fee
  const fee = parsedAmount * WITHDRAWAL_FEE_PERCENT;
  const netAmount = parsedAmount - fee;

  return {
    userId,
    userData,
    amount: parsedAmount,
    fee,
    netAmount,
    wallet,
    crypto: selectedCrypto,
  };
}
