import { client } from "../../sanity.js";

export async function getVipConfig(vipLevel = 0) {
  const vip = await client.fetch(
    `*[_type=="vipLevel" && level==$level][0]`,
    { level: vipLevel }
  );

  // fallback safety (VERY IMPORTANT)
  if (!vip) {
    return {
      level: 0,
      minWithdrawal: 20,
      maxWithdrawal: 100,
      dailyWithdrawalLimit: 100,
      maxDailyWithdrawals: 5,
    };
  }

  return vip;
}

