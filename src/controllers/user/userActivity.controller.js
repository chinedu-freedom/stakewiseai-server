import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { client } from "../../lib/sanity.js";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "../../lib/pagination.js";

export const getUserActivitiesController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  // Pagination
  const { page, limit, start, end } = getPaginationParams(req);

  // Total count
  const totalCount = await client.fetch(
    `count(*[_type == "userActivity" && user._ref == $userId])`,
    { userId }
  );

  // Fetch paginated activities
  const activities = await client.fetch(
    `*[_type == "userActivity" && user._ref == $userId]
      | order(timestamp desc)
      [${start}...${end}] {
        _id,
        action,
        details,
        timestamp
      }`,
    { userId }
  );

  const pagination = buildPaginationMeta(totalCount, page, limit);

  return sendResponse(
    res,
    true,
    "User activities fetched successfully",
    200,
    {
      activities,
      pagination,
    }
  );
});
