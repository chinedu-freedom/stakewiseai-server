import { client } from "../../sanity.js";

export async function getUserLoans(userId) {
  try {
    const loans = await client.fetch(
      `*[_type=="userInvestment" && user._ref == $userId && planType=="loan"]{
        _id,
        amount,
        interestAmount,
        startDate,
        repaymentDate,
        status,
        plan->{
          duration
        }
      }`,
      { userId }
    );

    return {
      success: true,
      message: "Loans fetched successfully",
      status: 200,
      data: loans,
    };
  } catch (error) {
    console.error("❌ getUserLoans error:", error);
    return {
      success: false,
      message: "Failed to fetch loans",
      status: 500,
      data: { details: error.message },
    };
  }
}
