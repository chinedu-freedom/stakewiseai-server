import { client } from "../../../lib/sanity.js";

export async function getAllStockBondInvestments() {
  try {
    const investments = await client.fetch(
      `*[_type == "userInvestment" && planType == "stockBond"]{
        _id,
        unitsHeld,
        amount,
        status,
        startDate,
        endDate,
        user->{
          _id,
          fullName,
          email
        },
        plan->{
          _id,
          title,
          type,
          currentPrice,
          changePercent
        }
      }`
    );

    return {
      success: true,
      message: "All stock & bond investments fetched successfully",
      status: 200,
      data: investments,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch stock & bond investments",
      status: 500,
      data: { details: error.message },
    };
  }
}
