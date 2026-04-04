import { asyncHandler } from "../../../lib/asyncHandler.js";
import { sendResponse } from "../../../lib/response.js";
import { getUserAndPlan } from "../../../lib/helpers/cryptoInvestment/getUserAndPlan.js";
import { validateInvestmentEligibility } from "../../../lib/helpers/cryptoInvestment/validateInvestmentEligibility.js";
import { createInvestmentRecord } from "../../../lib/helpers/cryptoInvestment/createInvestmentRecord.js";
import { validateCryptoInvestmentInput } from "../../../lib/helpers/cryptoInvestment/validateCryptoInvestment.js";

export const createCryptoInvestmentHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  // Validate input
  const inputValidation = validateCryptoInvestmentInput(req.body);

  if (!inputValidation.success) {
    return sendResponse(
      res,
      false,
      inputValidation.message,
      inputValidation.status
    );
  }

  const { planId, amount } = inputValidation.data;

  // Fetch user & plan
  const userPlanResponse = await getUserAndPlan(userId, planId);

  if (!userPlanResponse.success) {
    return sendResponse(
      res,
      false,
      userPlanResponse.message,
      userPlanResponse.status
    );
  }

  const { user: userData, plan } = userPlanResponse.data;

  // Eligibility check
  const eligibilityResponse = await validateInvestmentEligibility(
    userData,
    plan,
    amount,
    userId,
    planId
  );

  if (!eligibilityResponse.success) {
    return sendResponse(
      res,
      false,
      eligibilityResponse.message,
      eligibilityResponse.status
    );
  }

  // Create investment
  const investmentResponse = await createInvestmentRecord(
    userId,
    planId,
    "crypto",
    amount,
    plan.contractDuration
  );

  if (investmentResponse.success) {
    return sendResponse(
      res,
      true,
      "Crypto investment submitted successfully",
      201,
      investmentResponse.data
    );
  }

  // Failure case
  return sendResponse(
    res,
    false,
    investmentResponse.error || "Failed to create investment",
    500,
    investmentResponse.error
      ? { details: investmentResponse.error }
      : undefined
  );
});