export function validateCryptoInvestmentInput(body) {
  const { planId, amount } = body || {};

  if (!planId || typeof planId !== "string") {
    return {
      success: false,
      message: "Plan ID is required and must be a valid string",
      status: 400,
    };
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    return {
      success: false,
      message: "Amount must be greater than 0",
      status: 400,
    };
  }

  return {
    success: true,
    data: {
      planId,
      amount: Number(amount),
    },
  };
}
