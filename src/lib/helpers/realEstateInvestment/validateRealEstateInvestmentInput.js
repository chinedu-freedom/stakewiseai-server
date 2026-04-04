export function validateRealEstateInvestmentInput(body) {
  const { planId, amount } = body || {};

  if (!planId || typeof planId !== "string") {
    return {
      success: false,
      message: "Plan ID is required and must be a valid string",
      status: 400,
    };
  }

  const numericAmount = Number(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      success: false,
      message: "Amount must be greater than 0",
      status: 400,
    };
  }

  return {
    success: true,
    message: "Input validated successfully",
    status: 200,
    data: {
      planId,
      amount: numericAmount,
    },
  };
}



