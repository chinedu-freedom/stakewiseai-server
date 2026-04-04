import { client } from "../../sanity.js";
import { v4 as uuid } from "uuid";
import { logUserActivity } from "../../logUserActivity.js";

export async function createLoanInvestment(
  userId,
  plan,
  amount,
  startDate,
  repaymentDetails
) {
  try {
  const { interestAmount, repaymentDate, totalRepayable } = repaymentDetails.data;


    const newLoanInvestment = {
      _id: uuid(),
      _type: "userInvestment",

      user: { _type: "reference", _ref: userId },
      plan: { _type: "reference", _ref: plan._id },
      planType: "loan",

      amount,

      interestRate: plan.interest,
      duration: plan.duration,

      interestAmount,
      totalRepayable,

      startDate,
      repaymentDate,
      endDate: repaymentDate,

      status: "pending",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await client.create(newLoanInvestment);

    await logUserActivity(
      userId,
      "Loan Request Submitted",
      `Loan created successfully for Plan ID: ${plan._id}, Amount: ${amount}`,
      "success"
    );

    return {
      success: true,
      message: "Loan request created successfully",
      status: 201,
      data: result,
    };
  } catch (error) {
    await logUserActivity(
      userId,
      "Loan Request Failed",
      `Loan creation failed for Plan ID: ${plan._id}, Amount: ${amount}, Error: ${error.message}`,
      "failed"
    );

    return {
      success: false,
      message: "Failed to create loan request",
      status: 500,
      error: error.message,
    };
  }
}
