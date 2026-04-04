import { asyncHandler } from "../../../lib/asyncHandler.js";
import { sendResponse } from "../../../lib/response.js";
import { getUserAndPlan } from "../../../lib/helpers/cryptoInvestment/getUserAndPlan.js";
import { validateInvestmentEligibility } from "../../../lib/helpers/cryptoInvestment/validateInvestmentEligibility.js";
import { createInvestmentRecord } from "../../../lib/helpers/cryptoInvestment/createInvestmentRecord.js";
import { validateCryptoInvestmentInput } from "../../../lib/helpers/cryptoInvestment/validateCryptoInvestment.js";
import { logUserActivity } from "../../../lib/logUserActivity.js";

export const createCryptoInvestmentHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  // Log initial attempt
  await logUserActivity(
    userId,
    "Crypto Investment Attempt",
    "Attempted a crypto investment",
    "pending"
  );

  // Validate input
  const inputValidation = validateCryptoInvestmentInput(req.body);
  if (!inputValidation.success) {
    await logUserActivity(
      userId,
      "Crypto Investment Failed",
      inputValidation.message,
      "failed"
    );
    return sendResponse(res, false, inputValidation.message, inputValidation.status);
  }

  const { planId, amount } = inputValidation.data;

  // Fetch user & plan
  const userPlanResponse = await getUserAndPlan(userId, planId);
  if (!userPlanResponse.success) {
    await logUserActivity(
      userId,
      "Crypto Investment Failed",
      userPlanResponse.message,
      "failed"
    );
    return sendResponse(res, false, userPlanResponse.message, userPlanResponse.status);
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
    await logUserActivity(
      userId,
      "Crypto Investment Failed",
      eligibilityResponse.message,
      "failed"
    );
    return sendResponse(res, false, eligibilityResponse.message, eligibilityResponse.status);
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
    await logUserActivity(
      userId,
      "Crypto Investment Submitted",
      `Investment of ${amount} in plan ${plan.title} created successfully`,
      "success"
    );
    return sendResponse(res, true, "Crypto investment submitted successfully", 201, investmentResponse.data);
  }

  // If we reach here, creation failed
  await logUserActivity(
    userId,
    "Crypto Investment Failed",
    investmentResponse.error || `Failed to create investment of ${amount} in plan ${plan.title}`,
    "failed"
  );

  return sendResponse(
    res,
    false,
    investmentResponse.error || "Failed to create investment",
    500,
    investmentResponse.error ? { details: investmentResponse.error } : undefined
  );
});
