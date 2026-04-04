import { client } from "../../sanity.js";

export async function checkExistingLoanInvestment(userId, planId) {
  try {
    const existingInvestment = await client.fetch(
      `*[
        user._ref == $userId &&
        plan._ref == $planId &&
        planType == "loan" &&
        status in ["active", "pending"]
      ][0]`,
      { userId, planId }
    );

    if (existingInvestment) {
      return {
        success: false,
        message: "You already have an active or pending investment in this loan plan. Please wait for it to complete.",
        status: 400
      };
    }

    return {
      success: true,
      message: "No existing investment found",
      status: 200
    };
  } catch (error) {
    console.error("❌ checkExistingLoanInvestment error:", error);
    return {
      success: false,
      message: "Failed to check existing loan investment",
      status: 500,
      data: { details: error.message }
    };
  }
}
