export function computeLoan(amount, interestRate, duration, startDate) {
const interestAmount = (amount * interestRate) / 100;
const totalRepayable = amount + interestAmount;

const start = new Date(startDate);
const repaymentDate = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

return {
  success: true,
  message: "Loan computed successfully",
  data: {
    amount,
    interestRate,
    duration,
    interestAmount,
    totalRepayable,
    startDate: start.toISOString(),
    repaymentDate: repaymentDate.toISOString(),
  },
};
}
