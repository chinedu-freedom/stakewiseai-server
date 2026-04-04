import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "../../lib/pagination.js";

export const getStockBondPlansHandler = asyncHandler(async (req, res) => {
  const { page, limit, start, end } = getPaginationParams(req);

  const plansQuery = `*[_type == "stockBondPlan" && status == "active"]
    | order(createdAt desc)
    [${start}...${end}]{
      _id,
      title,
      type,
      unitHeld,
      changePercent,
      currentPrice,
      "imageUrl": image.asset->url,
      status,
      createdAt,
      updatedAt
    }`;

  const plans = await client.fetch(plansQuery);

  const total = await client.fetch(
    `count(*[_type == "stockBondPlan" && status == "active"])`
  );

  return sendResponse(res, true, "Stock/Bond plans fetched successfully", 200, {
    plans,
    meta: buildPaginationMeta(total, page, limit),
  });
});
