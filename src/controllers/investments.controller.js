import { client } from "../lib/sanity.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendResponse } from "../lib/response.js";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "../lib/pagination.js";
import { getUserAndPlan } from "../lib/helpers/investment/getUserAndPlan.js";
import { validateInvestmentEligibility } from "../lib/helpers/investment/validateInvestmentEligibility.js";
import { createInvestmentRecord } from "../lib/helpers/investment/createInvestmentRecord.js";
import { validateInvestmentInput } from "../lib/helpers/investment/validateInvestmentInput.js";
import { logUserActivity } from "../lib/logUserActivity.js";


/**
 * @desc Create a new investment
 * @route POST /api/users/investments/crypto
 * @access Private
 */
export const createInvestmentHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  // Validate input
  const inputValidation = validateInvestmentInput(req.body);

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

  const { user, plan } = userPlanResponse.data;

  // Eligibility check
  const eligibilityResponse = await validateInvestmentEligibility(
    user,
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
    plan,
    planId,
    amount
  );

  if (investmentResponse.success) {
    logUserActivity(
      userId,
      "Investment Created",
      `Invested $${amount} in ${plan.title} plan`,
      "success"
    ).catch(console.error);

    return sendResponse(
      res,
      true,
      "Investment created successfully",
      201,
      investmentResponse.data
    );
  }

  logUserActivity(
    userId,
    "Investment Failed",
    investmentResponse.error || "Failed to create investment record",
    "error"
  ).catch(console.error);

  return sendResponse(
    res,
    false,
    investmentResponse.error || "Failed to create investment",
    500
  );
});

export const fetchAllInvestmentsController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  const { page, limit, start, end } = getPaginationParams(req);

  const query = `*[_type == "userInvestment" && user._ref == $userId] | order(createdAt desc) [${start}...${end}]{
    _id,
    amount,
    profitEarned,
    totalWithdrawn,
    status,
    maturityStatus,
    isFixedDeposit,
    startDate,
    endDate,
    lastCreditedAt,
    createdAt,
    plan->{
      _id,
      title,
      dailyProfit,
      contractDuration,
      roiPercent
    }
  }`;

  const countQuery = `count(*[_type == "userInvestment" && user._ref == $userId])`;

  const [investments, total] = await Promise.all([
    client.fetch(query, { userId }),
    client.fetch(countQuery, { userId }),
  ]);

  const enrichedInvestments = (investments || []).map((inv) => {
    const duration = Number(inv.plan?.contractDuration || 0);
    const start = new Date(inv.startDate || inv.createdAt || Date.now());
    const end = inv.endDate
      ? new Date(inv.endDate)
      : new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
    const now = new Date();
    const msRemaining = end.getTime() - now.getTime();
    const daysLeft = inv.status === "completed"
      ? 0
      : Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.min(
      duration,
      Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    );

    return {
      ...inv,
      daysLeft,
      daysPassed,
      endDate: end.toISOString(),
    };
  });

  return sendResponse(res, true, "Investments fetched successfully", 200, {
    investments: enrichedInvestments,
    meta: buildPaginationMeta(total, page, limit),
  });
});



