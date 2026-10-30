import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { getPaginationParams, buildPaginationMeta } from "../../lib/pagination.js";

// GET - Fetch referrals by logged-in user with pagination
export const getReferralsController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  // Pagination & Level parsing
  const { page, limit, start, end } = getPaginationParams(req);
  const level = parseInt(req.query.level) || 1;

  // Determine the relationship query based on level
  let referralCondition = `referredBy._ref == $userId`;
  
  if (level === 2) {
    // Level 2: Users whose referrer is referred by the current user
    referralCondition = `referredBy._ref in *[_type == "user" && referredBy._ref == $userId]._id`;
  } else if (level === 3) {
    // Level 3: Users whose referrer is in Level 2
    referralCondition = `referredBy._ref in *[_type == "user" && referredBy._ref in *[_type == "user" && referredBy._ref == $userId]._id]._id`;
  }

  const baseQuery = `*[_type == "user" && ${referralCondition}]`;

  // Total count of referrals at this level
  const totalCount = await client.fetch(`count(${baseQuery})`, { userId });

  // Fetch paginated referrals including totalInvestment for UI
  const referrals = await client.fetch(
    `${baseQuery} | order(_createdAt desc) [${start}...${end}] {
      _id,
      email,
      phoneNumber,
      accountStatus,
      emailVerified,
      username,
      referralCode,
      totalInvestment,
      accountBalance,
      referredBy->{
        _id,
        username
      },
      _createdAt
    }`,
    { userId }
  );

  const pagination = buildPaginationMeta(totalCount, page, limit);

  return sendResponse(res, true, `Level ${level} Referrals fetched successfully`, 200, {
    level,
    referrals,
    pagination,
  });
});
