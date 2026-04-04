import { asyncHandler } from "../../../lib/asyncHandler.js";
import { sendResponse } from "../../../lib/response.js";
import { getUserAndStockBondPlan } from "../../../lib/helpers/stockBondInvestment/getUserAndStockBondPlan.js";
import { validateStockBondInvestmentEligibility } from "../../../lib/helpers/stockBondInvestment/validateStockBondInvestmentEligibility.js";
import { createStockBondInvestmentRecord } from "../../../lib/helpers/stockBondInvestment/createStockBondInvestmentRecord.js";
import { validateStockBondInvestmentInput } from "../../../lib/helpers/stockBondInvestment/validateStockBondInvestmentInput.js";
import { logUserActivity } from "../../../lib/logUserActivity.js";
import { getAllStockBondInvestments } from "../../../lib/helpers/stockBondInvestment/getAllStockBondInvestments.js";


export const createStockBondInvestmentHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  await logUserActivity(
    userId,
    "Stock/Bond Investment Attempt",
    "Attempted a stock/bond investment",
    "pending"
  );

  const inputValidation = validateStockBondInvestmentInput(req.body);
  if (!inputValidation.success) {
    await logUserActivity(
      userId,
      "Stock/Bond Investment Failed",
      inputValidation.message,
      "failed"
    );
    return sendResponse(res, false, inputValidation.message, inputValidation.status);
  }

  const { planId } = inputValidation.data;

  // Fetch user and plan
  const userPlanResponse = await getUserAndStockBondPlan(userId, planId);
  if (!userPlanResponse.success) {
    await logUserActivity(
      userId,
      "Stock/Bond Investment Failed",
      userPlanResponse.message,
      "failed"
    );
    return sendResponse(res, false, userPlanResponse.message, userPlanResponse.status);
  }

  const { user: userData, plan } = userPlanResponse.data;

  // Check eligibility
  const eligibilityResponse = await validateStockBondInvestmentEligibility(
    userData,
    plan,
    userId,
    planId
  );

  if (!eligibilityResponse.success) {
    await logUserActivity(
      userId,
      "Stock/Bond Investment Failed",
      eligibilityResponse.message,
      "failed"
    );
    return sendResponse(res, false, eligibilityResponse.message, eligibilityResponse.status);
  }

  const { unitsHeld, totalCost } = eligibilityResponse.data;

  // Create investment
  const investmentResponse = await createStockBondInvestmentRecord(
    userId,
    planId,
    unitsHeld,
    totalCost
  );

  await logUserActivity(
    userId,
    investmentResponse.success
      ? "Stock/Bond Investment Submitted"
      : "Stock/Bond Investment Failed",
    investmentResponse.message,
    investmentResponse.success ? "success" : "failed"
  );

  return sendResponse(
    res,
    investmentResponse.success,
    investmentResponse.message,
    investmentResponse.status || (investmentResponse.success ? 201 : 500),
    investmentResponse.data
  );
});


export const getAllStockBondAnalyticsHandler = asyncHandler(async (req, res) => {
  const result = await getAllStockBondInvestments();

  if (!result.success) {
    await logUserActivity(
      req.user?.userId || "system",
      "Stock/Bond Analytics Failed",
      result.message,
      "failed"
    );
  }

  return sendResponse(
    res,
    result.success,
    result.message,
    result.status,
    result.data
  );
});

// export const getUserStockBondAnalyticsHandler = asyncHandler(async (req, res) => {
//   const userId = req.user?.userId;

//   if (!userId) {
//     return sendResponse(res, false, "Unauthorized", 401);
//   }

//   try {
//     const investments = await client.fetch(
//       `*[_type == "userInvestment"
//         && user._ref == $userId
//         && planType == "stockBond"]{
//           _id,
//           unitsHeld,
//           amount,
//           status,
//           startDate,
//           endDate,
//           plan->{
//             _id,
//             title,
//             type,
//             currentPrice,
//             changePercent
//           }
//         }`,
//       { userId }
//     );

//     return sendResponse(
//       res,
//       true,
//       "Stock & Bond analytics fetched successfully",
//       200,
//       investments
//     );
//   } catch (error) {
//     await logUserActivity(
//       userId,
//       "Stock/Bond Analytics Failed",
//       `Error fetching analytics: ${error.message}`,
//       "failed"
//     );

//     return sendResponse(res, false, "Failed to fetch stock & bond analytics", 500, {
//       details: error.message,
//     });
//   }
// });
