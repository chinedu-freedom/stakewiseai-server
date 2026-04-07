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


// import { client } from "../../sanity.js";

// const vipCache = new Map();

// export async function getVipConfig(vipLevel = 0) {
//   // ✅ Check cache first
//   if (vipCache.has(vipLevel)) {
//     return vipCache.get(vipLevel);
//   }

//   const vip = await client.fetch(
//     `*[_type=="vipLevel" && level==$level][0]`,
//     { level: vipLevel }
//   );

//   const result = vip || {
//     level: 0,
//     minWithdrawal: 20,
//     maxWithdrawal: 100,
//     dailyWithdrawalLimit: 100,
//     maxDailyWithdrawals: 5,
//     bonusPercentage: 0,
//   };

//   // ✅ Store in cache
//   vipCache.set(vipLevel, result);

//   return result;
// }