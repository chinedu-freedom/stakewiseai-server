import { client } from "../lib/sanity.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendResponse } from "../lib/response.js";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "../lib/pagination.js";

export const getPlansHandler = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim();
  const { page, limit, start, end } = getPaginationParams(req);

  const filters = [`_type == "cryptoPlan" && status == "active"`];
  const params = {};

  if (search) {
    filters.push(`(title match $search || _id match $searchExact)`);
    params.search = `${search}*`;
    params.searchExact = search;
  }

  const whereClause = filters.join(" && ");

  const plansQuery = `*[
    ${whereClause}
  ] | order(createdAt desc) [${start}...${end}]{
    _id,
    title,
    minDeposit,
    maxDeposit,
    dailyProfit,
    contractDuration,
    status,
    createdAt,
    updatedAt
  }`;

  const plans = await client.fetch(plansQuery, {
    ...params,
    start,
    end,
  });

  const total = await client.fetch(
    `count(*[${whereClause}])`,
    params
  );

  return sendResponse(res, true, "Crypto plans fetched successfully", 200, {
    plans,
    meta: buildPaginationMeta(total, page, limit),
  });
});
    