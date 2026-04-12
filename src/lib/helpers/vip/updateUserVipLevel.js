import { client } from "../../sanity.js";

export async function updateUserVipLevel(userId) {
  // 1️⃣ Get user investment
  const user = await client.fetch(
    `*[_type=="user" && _id==$userId][0]{
      _id,
      totalInvestment,
      vipLevel
    }`,
    { userId }
  );

  if (!user) return;

  const totalInvestment = Number(user.totalInvestment) || 0;

  // 2️⃣ Get all VIP levels sorted highest → lowest
  // We check for minInvestment (matching the screenshot requirement)
  const vipLevels = await client.fetch(
    `*[_type=="vipLevel"] | order(minInvestment desc)`
  );

  if (!vipLevels || vipLevels.length === 0) return;

  // 3️⃣ Find the highest VIP level the user qualifies for
  let matchedVip = null;

  for (const vip of vipLevels) {
    if (totalInvestment >= (Number(vip.minInvestment) || 0)) {
      matchedVip = vip;
      break;
    }
  }

  if (!matchedVip) return;

  // 4️⃣ Only update if the level has changed
  if (user.vipLevel?._ref !== matchedVip._id) {
    await client
      .patch(userId)
      .set({
        vipLevel: {
          _type: "reference",
          _ref: matchedVip._id,
        },
        updatedAt: new Date().toISOString(),
      })
      .commit();
    
    console.log(`[VIP] User ${userId} upgraded to ${matchedVip.name}`);
  }

  return matchedVip;
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