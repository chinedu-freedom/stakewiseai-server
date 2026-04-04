import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "../../lib/pagination.js";

export const getRealEstatePlansHandler = asyncHandler(async (req, res) => {
  const { page, limit, start, end } = getPaginationParams(req);

  const plansQuery = `*[_type == "realEstatePlan" && status == "active"]
    | order(createdAt desc)
    [${start}...${end}]{
      _id,
      title,
      location,
      roiEstimate,
      contractDuration,
      minInvestment,
      status,
      "imageUrl": image.asset->url,
      createdAt,
      updatedAt
    }`;

  const plans = await client.fetch(plansQuery);

  const total = await client.fetch(
    `count(*[_type == "realEstatePlan" && status == "active"])`
  );

  return sendResponse(res, true, "Real estate plans fetched successfully", 200, {
    plans,
    meta: buildPaginationMeta(total, page, limit),
  });
});
