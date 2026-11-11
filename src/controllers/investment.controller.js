import { asyncHandler } from "../lib/asyncHandler.js";
import { client } from "../lib/sanity.js";
import { getPaginationParams, buildPaginationMeta } from "../lib/pagination.js";
import { sendResponse } from "../lib/response.js";

export const getPlansHandler = asyncHandler(async (req, res) => {
  const whereClause = `_type == "plan" && status == "active"`;

  const plansQuery = `*[
    ${whereClause}
  ] | order(createdAt asc){
    _id,
    title,
    minDeposit,
    maxDeposit,
    dailyProfit,
    contractDuration,
    roiPercent,
    isFixedDeposit,
    status,
    createdAt,
    updatedAt
  }`;

  const plans = await client.fetch(plansQuery);
  const total = plans?.length || 0;

  return sendResponse(res, true, "Plans fetched successfully", 200, {
    plans,
    meta: buildPaginationMeta(total, 1, total || 1),
    pagination: buildPaginationMeta(total, 1, total || 1),
  });
});



export const getPlanByIdHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return sendResponse(res, false, "Plan ID is required", 400);
  }

  const query = `*[
    _type == "plan" &&
    status == "active" &&
    _id == $id
  ][0]{
    _id,
    title,
    minDeposit,
    maxDeposit,
    dailyProfit,
    contractDuration,
    roiPercent,
    isFixedDeposit,
    status,
    createdAt,
    updatedAt
  }`;

  const plan = await client.fetch(query, { id });

  if (!plan) {
    return sendResponse(res, false, "Plan not found", 404);
  }

  return sendResponse(res, true, "Plan fetched successfully", 200, {
    plan,
  });
});