import { client } from "../../sanity.js";

export async function updateUserVipLevel(userId) {
  // 1️⃣ Get user profit
  const user = await client.fetch(
    `*[_type=="user" && _id==$userId][0]{
      _id,
      totalProfit,
      vipLevel
    }`,
    { userId }
  );

  if (!user) return;

  const totalProfit = Number(user.totalProfit) || 0;

  // 2️⃣ Get all VIP levels sorted highest → lowest
  const vipLevels = await client.fetch(
    `*[_type=="vipLevel"] | order(minTotalProfit desc)`
  );

  if (!vipLevels || vipLevels.length === 0) return;

  // 3️⃣ Find best matching VIP
  let newVipLevel = 0;

  for (const vip of vipLevels) {
    if (totalProfit >= vip.minTotalProfit) {
      newVipLevel = vip.level;
      break;
    }
  }

  // 4️⃣ Only update if changed
  if (newVipLevel !== user.vipLevel) {
    await client
      .patch(userId)
      .set({
        vipLevel: newVipLevel,
        updatedAt: new Date().toISOString(),
      })
      .commit();
  }
}

// import { client } from "../../sanity";

// export async function updateUserVipLevel(userId) {
//   // Get user investment
//   const user = await client.fetch(
//     `*[_type=="user" && _id==$id][0]{
//       _id,
//       totalInvestment
//     }`,
//     { id: userId }
//   );

//   if (!user) return;

//   // Get ALL VIP levels sorted DESC (highest first)
//   const vipLevels = await client.fetch(
//     `*[_type=="vipLevel"] | order(minInvestment desc)`
//   );

//   // Find highest VIP user qualifies for
//   const matchedVip = vipLevels.find(
//     (vip) => user.totalInvestment >= vip.minInvestment
//   );

//   if (!matchedVip) return;

//   // Update user VIP
//   await client
//     .patch(userId)
//     .set({
//       vipLevel: {
//         _type: "reference",
//         _ref: matchedVip._id,
//       },
//       updatedAt: new Date().toISOString(),
//     })
//     .commit();

//   return matchedVip;
// }