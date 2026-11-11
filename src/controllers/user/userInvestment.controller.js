import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { getPaginationParams, buildPaginationMeta } from "../../lib/pagination.js";
import { client } from "../../lib/sanity.js";

export const fetchAllInvestmentsController = asyncHandler(async (req, res) => {
  // Fetch all investments without pagination slicing
  const investments = await client.fetch(
    `*[_type == "userInvestment"]
      | order(createdAt desc) {
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
          username,
          email
        }
      }`
  );

  const totalCount = investments?.length || 0;
  const pagination = buildPaginationMeta(totalCount, 1, totalCount || 1);

  return sendResponse(res, true, "All investments fetched successfully", 200, {
    data: investments,
    pagination,
  });
});
