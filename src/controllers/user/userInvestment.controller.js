import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { getPaginationParams, buildPaginationMeta } from "../../lib/pagination.js";
import { client } from "../../lib/sanity.js";

export const fetchAllInvestmentsController = asyncHandler(async (req, res) => {
  // Pagination params
  const { page, limit, start, end } = getPaginationParams(req);

  // Count all investments (no user filter)
  const totalCount = await client.fetch(
    `count(*[_type == "userInvestment"])`
  );

  // Fetch paginated investments (ALL users)
  const investments = await client.fetch(
    `*[_type == "userInvestment"]
      | order(createdAt desc) [${start}...${end}] {
        _id,
        planType,
        amount,
        unitsHeld,
        expectedROI,
        interestAmount,
        repaymentDate,
        startDate,
        endDate,
        status,
        lastCreditedAt,
        createdAt,
        updatedAt,
        plan->{
          _id,
          title,
          duration,
          roiEstimate,
          contractDuration,
          changePercent,
          currentPrice,
          image
        },
        user->{
          _id,
          userName,
          email
        }
      }`
  );

  const pagination = buildPaginationMeta(totalCount, page, limit);

  return sendResponse(res, true, "All investments fetched successfully", 200, {
    data: investments,
    pagination,
  });
});
