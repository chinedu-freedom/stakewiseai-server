import { asyncHandler } from "../../../lib/asyncHandler.js";
import { sendResponse } from "../../../lib/response.js";
import { validateRealEstateInvestmentInput } from "../../../lib/helpers/realEstateInvestment/validateRealEstateInvestmentInput.js";
import { getUserAndRealEstatePlan } from "../../../lib/helpers/realEstateInvestment/getUserAndRealEstatePlan.js";
import { validateRealEstateInvestmentEligibility } from "../../../lib/helpers/realEstateInvestment/validateRealEstateInvestmentEligibility.js";
import { createRealEstateInvestmentRecord } from "../../../lib/helpers/realEstateInvestment/createRealEstateInvestmentRecord.js";
import { logUserActivity } from "../../../lib/logUserActivity.js";
import { getAllRealEstateInvestments } from "../../../lib/helpers/realEstateInvestment/getUserRealEstateInvestments.js";

export const createRealEstateInvestmentHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  await logUserActivity(
    userId,
    "Real Estate Investment Attempt",
    "Attempted a real estate investment",
    "pending"
  );

  const inputValidation = validateRealEstateInvestmentInput(req.body);
  if (!inputValidation.success) {
    await logUserActivity(
      userId,
      "Real Estate Investment Failed",
      inputValidation.message,
      "failed"
    );
    return sendResponse(res, false, inputValidation.message, inputValidation.status);
  }

  const { planId, amount } = inputValidation.data;

  const userPlanResponse = await getUserAndRealEstatePlan(userId, planId);
  if (!userPlanResponse.success) {
    await logUserActivity(
      userId,
      "Real Estate Investment Failed",
      userPlanResponse.message,
      "failed"
    );
    return sendResponse(
      res,
      false,
      userPlanResponse.message,
      userPlanResponse.status
    );
  }

  const { user: userData, plan } = userPlanResponse.data;

  const eligibilityResponse = await validateRealEstateInvestmentEligibility(
    userData,
    plan,
    amount,
    userId,
    planId
  );

  if (!eligibilityResponse.success) {
    await logUserActivity(
      userId,
      "Real Estate Investment Failed",
      eligibilityResponse.message,
      "failed"
    );
    return sendResponse(
      res,
      false,
      eligibilityResponse.message,
      eligibilityResponse.status
    );
  }

  const investmentResponse = await createRealEstateInvestmentRecord(
    userId,
    planId,
    amount,
    plan
  );

  await logUserActivity(
    userId,
    investmentResponse.success
      ? "Real Estate Investment Submitted"
      : "Real Estate Investment Failed",
    investmentResponse.message,
    investmentResponse.success ? "success" : "failed"
  );

  return sendResponse(
    res,
    investmentResponse.success,
    investmentResponse.message,
    investmentResponse.status,
    investmentResponse.data
  );
});



// export const getUserRealEstateAnalyticsHandler = asyncHandler(async (req, res) => {
//   const userId = req.user?.userId;

//   if (!userId) {
//     return sendResponse(res, false, "Unauthorized", 401);
//   }

//   const result = await getUserRealEstateInvestments(userId);

//   if (!result.success) {
//     await logUserActivity(
//       userId,
//       "Real Estate Analytics Failed",
//       result.message,
//       "failed"
//     );
//   }

//   return sendResponse(
//     res,
//     result.success,
//     result.message,
//     result.status,
//     result.data
//   );
// });

export const getAllRealEstateAnalyticsHandler = asyncHandler(async (req, res) => {
  const result = await getAllRealEstateInvestments();

  if (!result.success) {
    await logUserActivity(
      req.user?.userId || "system",
      "Real Estate Analytics Failed",
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
