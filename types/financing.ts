export interface FinancingParams {
  systemCostPerWatt: number; // typical ~$2.50-$3.50/W
  systemSizeKw: number;
  interestRate: number;
  loanTerm: number; // years
}

export interface FinancingCalculation {
  totalSystemCost: number;
  cashOption: {
    upfront: number;
    monthly: number;
    yearsToBreakEven: number;
    roi25Years: number;
  };
  loanOption: {
    downPayment: number;
    monthlyPayment: number;
    totalInterest: number;
    yearsToBreakEven: number;
    roi25Years: number;
  };
}
