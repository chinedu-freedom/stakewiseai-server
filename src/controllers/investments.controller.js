// import { client } from "../lib/sanity.js";
// import { asyncHandler } from "../lib/asyncHandler.js";
// import { sendResponse } from "../lib/response.js";
// import {
//   getPaginationParams,
//   buildPaginationMeta,
// } from "../lib/pagination.js";
// import { getUserAndPlan } from "../lib/helpers/investment/getUserAndPlan.js";
// import { validateInvestmentEligibility } from "../lib/helpers/investment/validateInvestmentEligibility.js";
// import { createInvestmentRecord } from "../lib/helpers/investment/createInvestmentRecord.js";
// import { validateInvestmentInput } from "../lib/helpers/investment/validateInvestmentInput.js";


// export const createInvestmentHandler = asyncHandler(async (req, res) => {
//   const userId = req.user?.userId;

//   if (!userId) {
//     return sendResponse(res, false, "Unauthorized: Please log in", 401);
//   }

//   // Validate input
//   const inputValidation = validateInvestmentInput(req.body);

//   if (!inputValidation.success) {
//     return sendResponse(
//       res,
//       false,
//       inputValidation.message,
//       inputValidation.status
//     );
//   }

//   const { planId, amount } = inputValidation.data;

//   // Fetch user & plan
//   const userPlanResponse = await getUserAndPlan(userId, planId);

//   if (!userPlanResponse.success) {
//     return sendResponse(
//       res,
//       false,
//       userPlanResponse.message,
//       userPlanResponse.status
//     );
//   }

//   const { user, plan } = userPlanResponse.data;

//   // Eligibility check
// const eligibilityResponse = await validateInvestmentEligibility(
//   user,
//   plan,
//   amount,
//   userId,
//   planId
// );

//   if (!eligibilityResponse.success) {
//     return sendResponse(
//       res,
//       false,
//       eligibilityResponse.message,
//       eligibilityResponse.status
//     );
//   }

//   // Create investment
// const investmentResponse = await createInvestmentRecord(
//   userId,
//   plan,
//   planId,
//   amount
// );

//   if (investmentResponse.success) {
//     return sendResponse(
//       res,
//       true,
//       "Investment created successfully",
//       201,
//       investmentResponse.data
//     );
//   }

//   return sendResponse(
//     res,
//     false,
//     investmentResponse.error || "Failed to create investment",
//     500
//   );
// });




// export const getPlansHandler = asyncHandler(async (req, res) => {
//   const search = req.query.search?.trim();
//   const { page, limit, start, end } = getPaginationParams(req);

//   const filters = [`_type == "cryptoPlan" && status == "active"`];
//   const params = {};

//   if (search) {
//     filters.push(`(title match $search || _id match $searchExact)`);
//     params.search = `${search}*`;
//     params.searchExact = search;
//   }

//   const whereClause = filters.join(" && ");

//   const plansQuery = `*[
//     ${whereClause}
//   ] | order(createdAt desc) [${start}...${end}]{
//     _id,
//     title,
//     minDeposit,
//     maxDeposit,
//     dailyProfit,
//     contractDuration,
//     status,
//     createdAt,
//     updatedAt
//   }`;

//   const plans = await client.fetch(plansQuery, {
//     ...params,
//     start,
//     end,
//   });

//   const total = await client.fetch(
//     `count(*[${whereClause}])`,
//     params
//   );

//   return sendResponse(res, true, "Crypto plans fetched successfully", 200, {
//     plans,
//     meta: buildPaginationMeta(total, page, limit),
//   });
// });
    