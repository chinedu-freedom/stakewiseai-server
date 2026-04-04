import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { getPaginationParams, buildPaginationMeta } from "../../lib/pagination.js";

// GET - Fetch referrals by logged-in user with pagination
export const getReferralsController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) return sendResponse(res, false, "Unauthorized: Please log in", 401);

  // Pagination
  const { page, limit, start, end } = getPaginationParams(req);

  // Total count of referrals
  const totalCount = await client.fetch(
    `count(*[_type == "user" && referredBy._ref == $userId])`,
    { userId }
  );

  // Fetch paginated referrals
  const referrals = await client.fetch(
    `*[_type == "user" && referredBy._ref == $userId] | order(_createdAt desc) [${start}...${end}] {
      _id,
      fullName,
      email,
      accountStatus,
      emailVerified,
      referralCode,
      referredBy->{
        _id,
        fullName
      },
      _createdAt
    }`,
    { userId }
  );

  const pagination = buildPaginationMeta(totalCount, page, limit);

  return sendResponse(res, true, "Referrals fetched successfully", 200, {
    referrals,
    pagination,
  });
});
