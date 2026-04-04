import { client } from "../../sanity.js";
import { sendResponse } from "../../response.js";

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

  // Validate crypto
  if (!cryptoType) {
    sendResponse(res, false, "Crypto type is required", 400);
    return { error: true };
  }

  // Validate wallet
  if (!wallet) {
    sendResponse(res, false, "Wallet address is required", 400);
    return { error: true };
  }

  // Validate amount
  if (amount === undefined || amount === null || isNaN(parsedAmount)) {
    sendResponse(res, false, "Amount must be a valid number", 400);
    return { error: true };
  }

  if (parsedAmount < MIN_WITHDRAWAL) {
    sendResponse(
      res,
      false,
      `Minimum withdrawal is $${MIN_WITHDRAWAL}`,
      400
    );
    return { error: true };
  }

  if (parsedAmount > MAX_WITHDRAWAL) {
    sendResponse(
      res,
      false,
      `Maximum withdrawal is $${MAX_WITHDRAWAL}`,
      400
    );
    return { error: true };
  }

  // Validate crypto list
  const allowedCryptos = ["USDT", "BTC", "ETH", "BNB", "TRX"];

  if (!allowedCryptos.includes(cryptoType)) {
    sendResponse(
      res,
      false,
      "Invalid crypto type. Allowed: USDT, BTC, ETH, BNB, TRX.",
      400
    );
    return { error: true };
  }

  // Fetch user safely (null-proof calculation)
  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      _id,
      username,
      email,
      totalProfit,
      reservedProfit,
      "availableProfit": coalesce(totalProfit, 0) - coalesce(reservedProfit, 0)
    }`,
    { userId }
  );

  if (!userData) {
    sendResponse(res, false, "User not found", 404);
    return { error: true };
  }

  const availableProfit = Number(userData.availableProfit) || 0;

  if (availableProfit < parsedAmount) {
    sendResponse(res, false, "Insufficient available profit", 400);
    return { error: true };
  }

  // Check existing pending withdrawal
  const pendingWithdrawal = await client.fetch(
    `count(*[_type=="withdrawal" && user._ref==$userId && status=="pending"])`,
    { userId }
  );

  if (pendingWithdrawal > 0) {
    sendResponse(
      res,
      false,
      "You already have a pending withdrawal",
      400
    );
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