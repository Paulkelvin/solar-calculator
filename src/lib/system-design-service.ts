/**
 * System Design Variations Service
 * Phase 5.2: Show multiple system sizes with different ROI/savings
 * 
 * Helps customers choose between 3 options: Conservative, Standard, Aggressive
 */

export interface SystemDesignOption {
  name: string;
  description: string;
  systemSizeKw: number;
  percentageOfConsumption: number; // What % of usage this covers
  estimatedAnnualProduction: number; // kWh
  systemCostUSD: number;
  monthlyPaymentLoan: number;
  firstYearSavings: number;
  paybackYears: number;
  roi25Year: number;
  recommendedFor: string;
}

// Import centralized constants to avoid drift between calculation modules
import {
  SYSTEM_COST_PER_WATT,
  AVG_PRODUCTION_PER_KW,
  LOAN_INTEREST_RATE,
  LOAN_TERM_YEARS,
  BASE_ELECTRICITY_RATE,
  RATE_ESCALATION,
  PANEL_DEGRADATION
} from './calculations/solar';

/**
 * Calculate monthly loan payment using standard amortization
 */
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Generate 3 system design options based on annual consumption
 * 
 * @param annualConsumptionKwh - Annual electricity consumption in kWh
 * @param sunFactor - Adjustment factor for sun exposure (0.7-1.15)
 * @param stateForIncentives - State for incentive lookup (optional)
 * @returns Array of 3 system options (conservative, standard, aggressive)
 */
export function generateSystemDesignOptions(
  annualConsumptionKwh: number,
  sunFactor: number = 1.0,
  stateForIncentives?: string
): SystemDesignOption[] {
  const adjustedProduction = annualConsumptionKwh / sunFactor;

  // 3 options: cover 60%, 80%, 100% of consumption
  const coveragePercentages = [60, 80, 100];
  const names = ['Conservative', 'Standard', 'Aggressive'];
  const descriptions = [
    'Lower cost, partial offset (good for budget-conscious)',
    'Balanced approach, covers most usage (most popular)',
    'Maximum solar, full offset (best ROI long-term)'
  ];
  const recommendedFors = [
    'Budget-conscious homeowners',
    'Most homeowners (great balance)',
    'Long-term investors'
  ];

  return coveragePercentages.map((coverage, idx) => {
    const targetProduction = (adjustedProduction * coverage) / 100;
    const systemSizeKw = targetProduction / AVG_PRODUCTION_PER_KW;
    const systemCost = systemSizeKw * 1000 * SYSTEM_COST_PER_WATT;

    // Production metrics
    const annualProduction = systemSizeKw * AVG_PRODUCTION_PER_KW * sunFactor;
    const actualCoverage = (annualProduction / annualConsumptionKwh) * 100;

    // Financial metrics
    const monthlyProduction = annualProduction / 12;
    const monthlyElectricitySavings = monthlyProduction * BASE_ELECTRICITY_RATE;
    const firstYearSavings = monthlyElectricitySavings * 12;

    // Loan calculation (10% down to match solar.ts)
    const loanDownPayment = systemCost * 0.10;
    const loanPrincipal = systemCost - loanDownPayment;
    const monthlyPayment = calculateMonthlyPayment(
      loanPrincipal,
      LOAN_INTEREST_RATE,
      LOAN_TERM_YEARS
    );

    // ROI calculation (25-year) with rate escalation AND panel degradation
    let totalSavings = 0;
    for (let year = 0; year < 25; year++) {
      // Electricity rates go up, panel output goes down
      const rateMultiplier = Math.pow(1 + RATE_ESCALATION, year);
      const degradationMultiplier = Math.pow(1 - PANEL_DEGRADATION, year);
      const yearSavings = firstYearSavings * rateMultiplier * degradationMultiplier;
      totalSavings += yearSavings;
    }

    const totalInvestment = systemCost;
    const roi25Year = ((totalSavings - totalInvestment) / totalInvestment) * 100;

    // Payback period (cash purchase: when cumulative savings > system cost)
    let cumulativeSavings = 0;
    let paybackMonths = 300; // default 25yr if never pays back

    for (let month = 0; month < 300; month++) {
      const year = month / 12;
      const rateMultiplier = Math.pow(1 + RATE_ESCALATION, year);
      const degradationMultiplier = Math.pow(1 - PANEL_DEGRADATION, year);
      const monthlySaving = (firstYearSavings / 12) * rateMultiplier * degradationMultiplier;
      cumulativeSavings += monthlySaving;

      if (cumulativeSavings >= totalInvestment) {
        paybackMonths = month;
        break;
      }
    }

    const paybackYears = paybackMonths / 12;

    return {
      name: names[idx],
      description: descriptions[idx],
      systemSizeKw: Math.round(systemSizeKw * 10) / 10,
      percentageOfConsumption: Math.round(actualCoverage),
      estimatedAnnualProduction: Math.round(annualProduction),
      systemCostUSD: Math.round(systemCost),
      monthlyPaymentLoan: Math.round(monthlyPayment),
      firstYearSavings: Math.round(firstYearSavings),
      paybackYears: Math.round(paybackYears * 10) / 10,
      roi25Year: Math.round(roi25Year),
      recommendedFor: recommendedFors[idx]
    };
  });
}

/**
 * Format system design option for display
 */
export function formatSystemOption(option: SystemDesignOption): string {
  return `${option.name} (${option.systemSizeKw}kW) - ${option.percentageOfConsumption}% offset`;
}

/**
 * Determine which option is best value
 */
export function getBestValueOption(
  options: SystemDesignOption[]
): { option: SystemDesignOption; reason: string } {
  // Best value = highest ROI with reasonable payback
  const scored = options.map((opt) => ({
    option: opt,
    score: opt.roi25Year / Math.max(opt.paybackYears, 1) // ROI per year of payback
  }));

  const best = scored.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  );

  return {
    option: best.option,
    reason: `Best ROI (${best.option.roi25Year}%) with ${best.option.paybackYears}-year payback`
  };
}
