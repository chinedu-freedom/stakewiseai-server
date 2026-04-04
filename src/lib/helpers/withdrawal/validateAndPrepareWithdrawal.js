import { client } from "../../sanity.js";
import { sendResponse } from "../../response.js";
import { logUserActivity } from "../../logUserActivity.js";

const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 1_000_000;
const MAX_DAILY_WITHDRAWALS = 5;

export async function validateAndPrepareWithdrawal(req, user, res) {
  const userId = user?.userId;
  if (!userId) {
    sendResponse(res, false, "Unauthorized", 401);
    return { error: true };
  }

  const { crypto, amount, walletAddress } = req.body;
  const wallet = walletAddress?.trim();
  const cryptoType = crypto?.toUpperCase();
  const parsedAmount = Number(amount);

  if (!cryptoType) {
    await logUserActivity(userId, "Withdrawal", "Crypto type missing", "failed");
    sendResponse(res, false, "Crypto type is required", 400);
    return { error: true };
  }

  if (!wallet) {
    await logUserActivity(userId, "Withdrawal", "Wallet address missing", "failed");
    sendResponse(res, false, "Wallet address is required", 400);
    return { error: true };
  }

  if (amount === undefined || amount === null || isNaN(parsedAmount)) {
    await logUserActivity(userId, "Withdrawal", "Invalid withdrawal amount", "failed");
    sendResponse(res, false, "Amount must be a valid number", 400);
    return { error: true };
  }

  if (parsedAmount < MIN_WITHDRAWAL) {
    await logUserActivity(userId, "Withdrawal", "Amount below minimum", "failed");
    sendResponse(res, false, `Minimum withdrawal is $${MIN_WITHDRAWAL}`, 400);
    return { error: true };
  }

  if (parsedAmount > MAX_WITHDRAWAL) {
    await logUserActivity(userId, "Withdrawal", "Amount above maximum", "failed");
    sendResponse(res, false, `Maximum withdrawal is $${MAX_WITHDRAWAL}`, 400);
    return { error: true };
  }

  const allowedCryptos = ["USDT", "BTC", "ETH", "BNB", "TRX"];
  if (!allowedCryptos.includes(cryptoType)) {
    await logUserActivity(userId, "Withdrawal", "Invalid crypto type", "failed");
    sendResponse(
      res,
      false,
      "Invalid crypto type. Allowed: USDT, BTC, ETH, BNB, TRX.",
      400
    );
    return { error: true };
  }

  // ✅ FIXED: Safe profit calculation (null-proof)
  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      _id,
      fullName,
      email,
      totalProfit,
      reservedProfit,
      "availableProfit": coalesce(totalProfit, 0) - coalesce(reservedProfit, 0)
    }`,
    { userId }
  );
console.log('User Data:', userData);
  if (!userData) {
    sendResponse(res, false, "User not found", 404);
    return { error: true };
  }

  const availableProfit = Number(userData.availableProfit) || 0;

  if (availableProfit < parsedAmount) {
    await logUserActivity(
      userId,
      "Withdrawal",
      "Insufficient available profit",
      "failed"
    );
    sendResponse(res, false, "Insufficient available profit", 400);
    return { error: true };
  }

  // Check pending withdrawal
  const pendingWithdrawal = await client.fetch(
    `count(*[_type=="withdrawal" && user._ref==$userId && status=="pending"])`,
    { userId }
  );

  if (pendingWithdrawal > 0) {
    await logUserActivity(
      userId,
      "Withdrawal",
      "Existing pending withdrawal",
      "failed"
    );
    sendResponse(res, false, "You already have a pending withdrawal", 400);
    return { error: true };
  }

  // Daily withdrawal limit
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyWithdrawals = await client.fetch(
    `count(*[
      _type=="withdrawal" &&
      user._ref==$userId &&
      requestedAt >= $startOfDay
    ])`,
    { userId, startOfDay: startOfDay.toISOString() }
  );

  if (dailyWithdrawals >= MAX_DAILY_WITHDRAWALS) {
    await logUserActivity(
      userId,
      "Withdrawal",
      "Daily withdrawal limit exceeded",
      "failed"
    );
    sendResponse(
      res,
      false,
      "Daily withdrawal limit reached (5 per day)",
      400
    );
    return { error: true };
  }

  return {
    userId,
    userData,
    cryptoType,
    amount: parsedAmount,
    wallet,
    availableProfit,
  };
}
