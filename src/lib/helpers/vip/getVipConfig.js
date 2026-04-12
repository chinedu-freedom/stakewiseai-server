import { client } from "../../sanity.js";

export async function getVipConfig(vipLevelRef) {
  let vip;

  if (vipLevelRef?._ref) {
    vip = await client.fetch(`*[_type=="vipLevel" && _id==$id][0]`, {
      id: vipLevelRef._ref,
    });
  } else {
    // If no reference, find level 0 by number
    vip = await client.fetch(`*[_type=="vipLevel" && level==0][0]`);
  }

  // fallback safety (VERY IMPORTANT)
  if (!vip) {
    return {
      level: 0,
      name: "VIP 0",
      minWithdrawal: 20,
      maxWithdrawal: 100,
      dailyWithdrawalLimit: 100,
      maxDailyWithdrawals: 5,
      maxWeeklyWithdrawals: 20, // Default fallback
    };
  }

  return vip;
}

