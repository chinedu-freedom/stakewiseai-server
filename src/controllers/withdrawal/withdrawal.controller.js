import { validateAndPrepareWithdrawal } from "../../lib/helpers/withdrawal/validateAndPrepareWithdrawal.js";
import { sendResponse } from "../../lib/response.js";
import { createWithdrawal } from "../../lib/helpers/withdrawal/createWithdrawal.js";
import { client } from "../../lib/sanity.js";
import { getPaginationParams, buildPaginationMeta } from "../../lib/pagination.js";
import { asyncHandler } from "../../lib/asyncHandler.js";


export const createWithdrawalHandler = asyncHandler(async (req, res) => {
  const { user } = req; // attached by withAuth / withKycAuth

  const prep = await validateAndPrepareWithdrawal(req, user, res);
  if (prep?.error) return;

  const createdWithdrawal = await createWithdrawal(prep);

  return sendResponse(
    res,
    true,
    "Withdrawal request submitted successfully and is pending approval.",
    201,
    createdWithdrawal
  );
});


export const getWithdrawalsHandler = asyncHandler(async (req, res) => {
  // Pagination
  const { page, limit, start, end } = getPaginationParams(req);

  // Total count
  const totalCount = await client.fetch(
    `count(*[_type == "withdrawal"])`
  );

  // Fetch withdrawals
  const withdrawals = await client.fetch(
    `*[_type == "withdrawal"] 
      | order(requestedAt desc) 
      [${start}...${end}] {
        _id,
        requestedAt,
        amount,
        status,
        crypto,
        user -> {
          _id
        }
      }`
  );

  const pagination = buildPaginationMeta(totalCount, page, limit);

  return sendResponse(res, true, "Withdrawals fetched successfully", 200, {
    withdrawals,
    pagination,
  });
});
