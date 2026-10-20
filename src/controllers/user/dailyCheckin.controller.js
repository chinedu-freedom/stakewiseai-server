import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { client } from "../../lib/sanity.js";
import { logUserActivity } from "../../lib/logUserActivity.js";

const DAILY_REWARD_AMOUNT = 0.5; // $0.50 everyday
const MAX_STREAK_DAYS = 7;

export const getDailyCheckinStatusController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  const user = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      _id,
      accountBalance,
      lastDailyClaimAt,
      dailyClaimStreak,
      totalDailyClaimed
    }`,
    { userId }
  );

  if (!user) {
    return sendResponse(res, false, "User not found", 404);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const msUntilTomorrow = tomorrowStart - now.getTime();

  let claimedToday = false;
  let currentStreak = Number(user.dailyClaimStreak || 0);

  if (user.lastDailyClaimAt) {
    const lastClaim = new Date(user.lastDailyClaimAt);
    const lastClaimDayStart = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate()).getTime();

    if (lastClaimDayStart === todayStart) {
      claimedToday = true;
    } else {
      const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
      if (lastClaimDayStart !== yesterdayStart) {
        // Missed at least one calendar day, streak resets to 0
        currentStreak = 0;
      }
    }
  } else {
    currentStreak = 0;
  }

  const nextClaimDay = claimedToday
    ? currentStreak
    : (currentStreak % MAX_STREAK_DAYS) + 1;

  const rewards = [1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
    let status = "locked";
    if (claimedToday) {
      if (dayNum <= currentStreak) status = "claimed";
    } else {
      if (dayNum <= currentStreak) {
        status = "claimed";
      } else if (dayNum === nextClaimDay) {
        status = "available";
      }
    }
    return {
      day: dayNum,
      amount: DAILY_REWARD_AMOUNT,
      status,
    };
  });

  return sendResponse(res, true, "Daily check-in status retrieved", 200, {
    rewardAmount: DAILY_REWARD_AMOUNT,
    claimedToday,
    currentStreak,
    nextClaimDay,
    msUntilNextClaim: claimedToday ? msUntilTomorrow : 0,
    maxDays: MAX_STREAK_DAYS,
    rewards,
    accountBalance: Number(user.accountBalance || 0),
    totalDailyClaimed: Number(user.totalDailyClaimed || 0),
  });
});

export const claimDailyCheckinController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  const user = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      _id,
      accountBalance,
      totalProfit,
      lastDailyClaimAt,
      dailyClaimStreak,
      totalDailyClaimed
    }`,
    { userId }
  );

  if (!user) {
    return sendResponse(res, false, "User not found", 404);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (user.lastDailyClaimAt) {
    const lastClaim = new Date(user.lastDailyClaimAt);
    const lastClaimDayStart = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate()).getTime();
    if (lastClaimDayStart === todayStart) {
      return sendResponse(
        res,
        false,
        "You have already claimed your daily reward today. Please check back tomorrow!",
        400
      );
    }
  }

  let currentStreak = Number(user.dailyClaimStreak || 0);
  if (user.lastDailyClaimAt) {
    const lastClaim = new Date(user.lastDailyClaimAt);
    const lastClaimDayStart = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    if (lastClaimDayStart === yesterdayStart) {
      currentStreak = (currentStreak % MAX_STREAK_DAYS) + 1;
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  const rewardAmount = DAILY_REWARD_AMOUNT;

  // Update Sanity user document
  await client
    .patch(userId)
    .setIfMissing({
      accountBalance: 0,
      totalProfit: 0,
      dailyClaimStreak: 0,
      totalDailyClaimed: 0,
    })
    .inc({
      accountBalance: rewardAmount,
      totalProfit: rewardAmount,
      totalDailyClaimed: rewardAmount,
    })
    .set({
      lastDailyClaimAt: now.toISOString(),
      dailyClaimStreak: currentStreak,
    })
    .commit();

  // Log user activity
  logUserActivity(
    userId,
    "Daily Claim",
    `Claimed daily reward bonus of $${rewardAmount.toFixed(2)} (Streak Day ${currentStreak})`,
    "success"
  ).catch(console.error);

  const updatedBalance = Number(user.accountBalance || 0) + rewardAmount;

  return sendResponse(res, true, `Successfully claimed $${rewardAmount.toFixed(2)} daily bonus!`, 200, {
    rewardAmount,
    currentStreak,
    newBalance: updatedBalance,
    claimedAt: now.toISOString(),
  });
});
