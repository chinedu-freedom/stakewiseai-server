export function validateStockBondInvestmentInput(body) {
  const { planId } = body || {};

  if (!planId || typeof planId !== "string") {
    return {
      success: false,
      message: "Plan ID is required and must be a valid string",
      status: 400,
    };
  }

  return {
    success: true,
    message: "Input validated successfully",
    status: 200,
    data: { planId },
  };
}
