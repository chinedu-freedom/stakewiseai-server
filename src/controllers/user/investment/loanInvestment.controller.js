import { asyncHandler } from "../../../lib/asyncHandler.js";
import { sendResponse } from "../../../lib/response.js";
import { getUserLoanPlan } from "../../../lib/helpers/loanInvestment/getUserLoanPlan.js";
import { checkExistingLoanInvestment } from "../../../lib/helpers/loanInvestment/checkExistingLoanInvestment.js";
import { createLoanInvestment } from "../../../lib/helpers/loanInvestment/createLoanInvestment.js";
import { getUserInfo } from "../../../lib/helpers/loanInvestment/getUserInfo.js";
import { computeLoan } from "../../../lib/helpers/loanInvestment/computeLoan.js";
import { sendLoanApplicationEmail } from "../../../lib/mailer.js";
import { client } from "../../../lib/sanity.js";
import { logUserActivity } from "../../../lib/logUserActivity.js";
import { getUserLoans } from "../../../lib/helpers/loanInvestment/getUsersLoans.js";
import { getAllLoans } from "../../../lib/helpers/loanInvestment/getAllLoans.js";

export const createLoanInvestmentHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  const { planId, amount, startDate } = req.body;

  // Check for existing loan in the same plan
  const existingCheck = await checkExistingLoanInvestment(userId, planId);
  if (!existingCheck.success) {
    await logUserActivity(
      userId,
      "Loan Request Failed",
      `Existing loan in same plan prevented request (Plan ID: ${planId})`,
      "failed"
    );
    return sendResponse(res, false, existingCheck.message, existingCheck.status);
  }

  // Prevent past start dates
  const today = new Date();
  const loanStart = new Date(startDate);
  if (loanStart < today.setHours(0, 0, 0, 0)) {
    await logUserActivity(
      userId,
      "Loan Request Failed",
      `Attempted loan investment but start date in the past (Start Date: ${startDate})`,
      "failed"
    );
    return sendResponse(res, false, "Start date cannot be in the past", 400);
  }

  // Prevent overlapping loans (pending or active)
  const existingLoans = await client.fetch(
    `*[_type=="userInvestment" && user._ref == $userId && planType=="loan" && status in ["pending","active"]]{
      repaymentDate
    }`,
    { userId }
  );

  if (existingLoans.length > 0) {
    const latestRepayment = new Date(existingLoans[0].repaymentDate);
    if (loanStart <= latestRepayment) {
      await logUserActivity(
        userId,
        "Loan Request Failed",
        `Overlapping loan detected. Ongoing loan until ${latestRepayment.toDateString()}`,
        "failed"
      );
      return sendResponse(
        res,
        false,
        `You already have an ongoing loan. Please wait until after ${latestRepayment.toDateString()}.`,
        400
      );
    }
  }

  // Get user info
  const userInfoResponse = await getUserInfo(userId);
  if (!userInfoResponse.success) {
    return sendResponse(res, false, userInfoResponse.message, userInfoResponse.status);
  }
  const { fullName: userName, email: userEmail } = userInfoResponse.data;

  // Get plan info
  const planResponse = await getUserLoanPlan(planId);
  if (!planResponse.success) {
    await logUserActivity(
      userId,
      "Loan Request Failed",
      `Loan plan not found (Plan ID: ${planId})`,
      "failed"
    );
    return sendResponse(res, false, planResponse.message, planResponse.status);
  }
  const plan = planResponse.data;

  // Validate amount range
  if (amount < plan.minAmount || amount > plan.maxAmount) {
    await logUserActivity(
      userId,
      "Loan Request Failed",
      `Amount out of range: ${amount}. Allowed: ${plan.minAmount}-${plan.maxAmount}`,
      "failed"
    );
    return sendResponse(res, false, `Amount must be between ${plan.minAmount} and ${plan.maxAmount}`, 400);
  }

  // Compute repayment details
  const repaymentDetails = computeLoan(amount, plan.interest, plan.duration, startDate);

  // Create loan investment
  const createResponse = await createLoanInvestment(userId, plan, amount, startDate, repaymentDetails);

  if (createResponse.success) {
    await logUserActivity(
      userId,
      "Loan Request Submitted",
      `Loan request created successfully for Plan ID: ${planId}, Amount: ${amount}`,
      "success"
    );
  } else {
    await logUserActivity(
      userId,
      "Loan Request Failed",
      `Loan creation failed for Plan ID: ${planId}, Amount: ${amount}`,
      "failed"
    );
    return sendResponse(res, false, createResponse.message || "Failed to create loan", createResponse.status || 500);
  }

  // Send loan application email
    sendLoanApplicationEmail({
      email: userEmail,
      name: userName,
      plan,
      amount,
      repaymentDetails: repaymentDetails.data,
    }).catch(err => { ;
      console.error("Failed to send loan application email:", err);
    });
  try {
    await logUserActivity(
      userId,
      "Loan Email Sent",
      `Loan application email sent successfully to ${userEmail}`,
      "success"
    );
  } catch (err) {
    await logUserActivity(
      userId,
      "Loan Email Failed",
      `Loan application email failed to send: ${err.message}`,
      "failed"
    );
  }

  return sendResponse(res, true, "Loan request submitted successfully", 201, createResponse.data);
});




export const loanPreviewHandler = asyncHandler(async (req, res) => {
  try {
    const { planId, amount, startDate } = req.body;

    if (!planId || !amount || !startDate) {
      return sendResponse(res, false, "planId, amount, and startDate are required", 400);
    }

    // Prevent past start dates
    const now = new Date();
    const start = new Date(startDate);
    if (start < now.setHours(0, 0, 0, 0)) {
      return sendResponse(res, false, "Start date cannot be in the past", 400);
    }

    // Fetch loan plan
    const plan = await client.fetch(
      `*[_type=="loanPlan" && _id==$planId && status=="active"][0]{
        _id,
        title,
        interest,
        duration,
        minAmount,
        maxAmount
      }`,
      { planId }
    );

    if (!plan) {
      return sendResponse(res, false, "Loan plan not found", 404);
    }

    // Validate amount range
    if (amount < plan.minAmount || amount > plan.maxAmount) {
      return sendResponse(
        res,
        false,
        `Amount must be between ${plan.minAmount} and ${plan.maxAmount}`,
        400
      );
    }

    // Compute loan preview
    const loanPreview = computeLoan(amount, plan.interest, plan.duration, startDate);

    return sendResponse(res, true, "Loan preview computed successfully", 200, {
      planTitle: plan.title,
      preview: loanPreview,
    });
  } catch (error) {
    console.error("❌ Loan preview error:", error);
    return sendResponse(res, false, "Failed to preview loan", 500, { details: error.message });
  }
});

export const getAllLoansHandler = asyncHandler(async (req, res) => {
  const result = await getAllLoans();

  if (!result.success) {
    await logUserActivity(
      req.user?.userId || "system",
      "Loan Analytics Failed",
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


// export const getUserLoansHandler = asyncHandler(async (req, res) => {
//   const userId = req.user?.userId;

//   if (!userId) {
//     return sendResponse(res, false, "Unauthorized", 401);
//   }

//   try {
//     const result = await getUserLoans(userId);

//     return sendResponse(
//       res,
//       result.success,
//       result.message,
//       result.status,
//       result.data
//     );
//   } catch (err) {
//     console.error("❌ getUserLoansHandler error:", err);
//     await logUserActivity(userId, "Loan Analytics Failed", `Error fetching loans: ${err.message}`, "failed");
//     return sendResponse(res, false, "Failed to fetch loans", 500, { details: err.message });
//   }
// });

