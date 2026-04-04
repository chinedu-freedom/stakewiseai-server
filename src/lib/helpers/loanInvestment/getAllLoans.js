import { client } from "../../../lib/sanity.js";

export async function getAllLoans() {
  try {
    const loans = await client.fetch(
      `*[_type == "loan"]{
        _id,
        amount,
        interestRate,
        duration,
        status,
        startDate,
        endDate,
        user->{
          _id,
          fullName,
          email
        }
      }`
    );

    return {
      success: true,
      message: "All loans fetched successfully",
      status: 200,
      data: loans,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch loans",
      status: 500,
      data: { details: error.message },
    };
  }
}
