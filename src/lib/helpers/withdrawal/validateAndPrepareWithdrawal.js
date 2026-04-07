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

  const cryptoType = "USDT";

  if (!wallet) {
    sendResponse(res, false, "Wallet address is required", 400);
    return { error: true };
  }

  if (amount === undefined || amount === null || isNaN(parsedAmount)) {
    sendResponse(res, false, "Amount is required and must be a valid number", 400);
    return { error: true };
  }

  // =========================
  // FETCH USER (WITH VIP)
  // =========================
  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      _id,
      username,
      email,
      totalProfit,
      reservedProfit,
      vipLevel,
      "availableProfit": coalesce(totalProfit, 0) - coalesce(reservedProfit, 0)
    }`,
    { userId }
  );

  if (!userData) {
    sendResponse(res, false, "User not found", 404);
    return { error: true };
  }

  // =========================
  // GET VIP CONFIG
  // =========================
  const vipConfig = await getVipConfig(userData.vipLevel);

  const MIN_WITHDRAWAL = vipConfig.minWithdrawal;
  const MAX_WITHDRAWAL = vipConfig.maxWithdrawal;
  const DAILY_WITHDRAWAL_LIMIT = vipConfig.dailyWithdrawalLimit;
  const MAX_DAILY_WITHDRAWALS = vipConfig.maxDailyWithdrawals;

  // =========================
  // VALIDATE AMOUNT (VIP BASED)
  // =========================
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
      `Maximum withdrawal per request is $${MAX_WITHDRAWAL}`,
      400
    );
    return { error: true };
  }

  // =========================
  // BALANCE CHECK
  // =========================
  const availableProfit = Number(userData.availableProfit) || 0;

  if (availableProfit < parsedAmount) {
    sendResponse(res, false, "Insufficient available profit", 400);
    return { error: true };
  }

  // =========================
  // DAILY LIMIT CALCULATION
  // =========================
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayWithdrawals = await client.fetch(
    `*[
      _type=="withdrawal" &&
      user._ref==$userId &&
      requestedAt >= $startOfDay
    ]{
      amount
    }`,
    { userId, startOfDay: startOfDay.toISOString() }
  );

  const dailyCount = todayWithdrawals.length;

  const dailyTotal = todayWithdrawals.reduce(
    (sum, w) => sum + (Number(w.amount) || 0),
    0
  );

  const remainingDailyLimit =
    DAILY_WITHDRAWAL_LIMIT - dailyTotal;

  if (dailyCount >= MAX_DAILY_WITHDRAWALS) {
    sendResponse(
      res,
      false,
      `Daily withdrawal count limit reached (${MAX_DAILY_WITHDRAWALS})`,
      400,
      { remainingDailyLimit: Math.max(0, remainingDailyLimit) }
    );
    return { error: true };
  }

  if (dailyTotal + parsedAmount > DAILY_WITHDRAWAL_LIMIT) {
    sendResponse(
      res,
      false,
      `Daily withdrawal limit exceeded. Max is $${DAILY_WITHDRAWAL_LIMIT}`,
      400,
      { remainingDailyLimit: Math.max(0, remainingDailyLimit) }
    );
    return { error: true };
  }

  // =========================
  // PENDING CHECK
  // =========================
  const pendingWithdrawal = await client.fetch(
    `count(*[_type=="withdrawal" && user._ref==$userId && status=="pending"])`,
    { userId }
  );

  if (pendingWithdrawal > 0) {
    sendResponse(
      res,
      false,
      "You already have a pending withdrawal",
      400,
      { remainingDailyLimit: Math.max(0, remainingDailyLimit) }
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
    remainingDailyLimit: Math.max(0, remainingDailyLimit),
  };
}

// import { client } from "../../sanity.js";
// import { sendResponse } from "../../response.js";

// const MIN_WITHDRAWAL = 20;
// const MAX_DAILY_WITHDRAWALS = 5;

// export async function validateAndPrepareWithdrawal(req, user, res) {
//   const userId = user?.userId;

//   if (!userId) {
//     sendResponse(res, false, "Unauthorized", 401);
//     return { error: true };
//   }

//   const { amount, walletAddress } = req.body;

//   const wallet = walletAddress?.trim();
//   const parsedAmount = Number(amount);

//   const cryptoType = "USDT";

//   // =========================
//   // BASIC VALIDATION
//   // =========================
//   if (!wallet) {
//     sendResponse(res, false, "Wallet address is required", 400);
//     return { error: true };
//   }

//   if (amount === undefined || amount === null || isNaN(parsedAmount)) {
//     sendResponse(res, false, "Amount must be a valid number", 400);
//     return { error: true };
//   }

//   if (parsedAmount < MIN_WITHDRAWAL) {
//     sendResponse(
//       res,
//       false,
//       `Minimum withdrawal is $${MIN_WITHDRAWAL}`,
//       400
//     );
//     return { error: true };
//   }

//   // =========================
//   // FETCH USER + VIP
//   // =========================
//   const userData = await client.fetch(
//     `*[_type == "user" && _id == $userId][0]{
//       _id,
//       username,
//       email,
//       totalProfit,
//       reservedProfit,
//       "availableProfit": coalesce(totalProfit, 0) - coalesce(reservedProfit, 0),
//       vipLevel->{
//         _id,
//         name,
//         dailyWithdrawalLimit,
//         maxWithdrawalPerTx
//       }
//     }`,
//     { userId }
//   );

//   if (!userData) {
//     sendResponse(res, false, "User not found", 404);
//     return { error: true };
//   }

//   const availableProfit = Number(userData.availableProfit) || 0;

//   if (availableProfit < parsedAmount) {
//     sendResponse(res, false, "Insufficient available profit", 400);
//     return { error: true };
//   }

//   // =========================
//   // VIP LIMITS (🔥 CORE CHANGE)
//   // =========================
//   const vip = userData.vipLevel;

//   // fallback if no VIP assigned
//   const maxPerTx = vip?.maxWithdrawalPerTx || 100;
//   const dailyLimit = vip?.dailyWithdrawalLimit || 100;

//   if (parsedAmount > maxPerTx) {
//     sendResponse(
//       res,
//       false,
//       `Max withdrawal per transaction is $${maxPerTx}`,
//       400
//     );
//     return { error: true };
//   }

//   // =========================
//   // DAILY TRACKING
//   // =========================
//   const startOfDay = new Date();
//   startOfDay.setHours(0, 0, 0, 0);

//   const todayWithdrawals = await client.fetch(
//     `*[
//       _type=="withdrawal" &&
//       user._ref==$userId &&
//       requestedAt >= $startOfDay
//     ]{
//       amount
//     }`,
//     { userId, startOfDay: startOfDay.toISOString() }
//   );

//   const dailyCount = todayWithdrawals.length;

//   const dailyTotal = todayWithdrawals.reduce(
//     (sum, w) => sum + (Number(w.amount) || 0),
//     0
//   );

//   const remainingDailyLimit = dailyLimit - dailyTotal;

//   if (dailyCount >= MAX_DAILY_WITHDRAWALS) {
//     sendResponse(
//       res,
//       false,
//       "Daily withdrawal count limit reached (5 per day)",
//       400,
//       {
//         remainingDailyLimit: Math.max(0, remainingDailyLimit),
//       }
//     );
//     return { error: true };
//   }

//   if (dailyTotal + parsedAmount > dailyLimit) {
//     sendResponse(
//       res,
//       false,
//       `Daily withdrawal limit exceeded. Your VIP allows $${dailyLimit}/day`,
//       400,
//       {
//         remainingDailyLimit: Math.max(0, remainingDailyLimit),
//       }
//     );
//     return { error: true };
//   }

//   // =========================
//   // PENDING CHECK
//   // =========================
//   const pendingWithdrawal = await client.fetch(
//     `count(*[_type=="withdrawal" && user._ref==$userId && status=="pending"])`,
//     { userId }
//   );

//   if (pendingWithdrawal > 0) {
//     sendResponse(
//       res,
//       false,
//       "You already have a pending withdrawal",
//       400,
//       {
//         remainingDailyLimit: Math.max(0, remainingDailyLimit),
//       }
//     );
//     return { error: true };
//   }

//   // =========================
//   // FINAL RETURN
//   // =========================
//   return {
//     userId,
//     userData,
//     cryptoType,
//     amount: parsedAmount,
//     wallet,
//     availableProfit,
//     remainingDailyLimit: Math.max(0, remainingDailyLimit),
//     vipLevel: vip?.name || "VIP 0",
//   };
// }