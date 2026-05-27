import { client } from "./sanity.js";

export async function getReferralsByUser(userId) {
  if (!userId) throw new Error("Missing user ID");

  const query = `*[_type == "user" && referredBy._ref == $userId]{
    _id,
    username,
    email,
    accountStatus,
    emailVerified,
    referralCode,
    referredBy->{
      _id,
      username
    },
    _createdAt
  } | order(createdAt desc)`;

  const referrals = await client.fetch(query, { userId });

  return referrals;
}



