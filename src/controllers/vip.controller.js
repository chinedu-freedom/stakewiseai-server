import { client } from "../lib/sanity.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendResponse } from "../lib/response.js";
import { getVipConfig } from "../lib/helpers/vip/getVipConfig.js";

export const getUserVipController = asyncHandler(async (req, res) => {
  const { user } = req;

  if (!user?.userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  // Fetch user
  const userData = await client.fetch(
    `*[_type=="user" && _id==$userId][0]{
      _id,
      username,
      vipLevel,
      totalProfit
    }`,
    { userId: user.userId }
  );

  if (!userData) {
    return sendResponse(res, false, "User not found", 404);
  }

  // Get VIP config
  const vipConfig = await getVipConfig(userData.vipLevel);

  return sendResponse(res, true, "VIP info fetched successfully", 200, {
    vipLevel: userData.vipLevel,
    totalProfit: userData.totalProfit,
    benefits: {
      minWithdrawal: vipConfig.minWithdrawal,
      maxWithdrawal: vipConfig.maxWithdrawal,
      dailyWithdrawalLimit: vipConfig.dailyWithdrawalLimit,
      maxDailyWithdrawals: vipConfig.maxDailyWithdrawals,
      bonusPercentage: vipConfig.bonusPercentage,
    },
  });
});