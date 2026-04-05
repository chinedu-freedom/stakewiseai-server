import { validateAndPrepareDeposit } from "../lib/helpers/deposit/validateAndPrepareDeposit.js";
import { createDeposit } from "../lib/helpers/deposit/createDeposit.js";
import { sendResponse } from "../lib/response.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { client } from "../lib/sanity.js";
import { getPaginationParams, buildPaginationMeta } from "../lib/pagination.js";

export const createDepositHandler = async (req, res, next) => {
  try {
    const { user } = req;

    const prep = await validateAndPrepareDeposit(req, user, res);
    if (!prep) return; // response already sent

    const createdFund = await createDeposit(prep);

    return sendResponse(res, true, "Deposit created successfully", 201, createdFund);
  } catch (error) {
    next(error);
  }
};

export const getDepositHistoryHandler = asyncHandler(async (req, res) => {
  const { page, limit, start, end } = getPaginationParams(req);

  const totalItems = await client.fetch(
    `count(*[_type == "deposit"])`
  );

  const deposits = await client.fetch(
    `*[_type == "deposit"] | order(_createdAt desc) [${start}...${end}]{
      _id,
      amount,
      status,
      crypto,
      _createdAt
    }`
  );

  const pagination = buildPaginationMeta(totalItems, page, limit);

  return sendResponse(
    res,
    true,
    "Deposit history fetched successfully",
    200,
    {
      data: deposits,
      pagination,
    }
  );
});
