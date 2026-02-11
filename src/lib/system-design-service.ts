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
  PANEL_DEGRADATION,
  FIXED_INSTALL_OVERHEAD
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

// FIXED_INSTALL_OVERHEAD is imported from solar.ts (single source of truth)

/**
 * Generate 3 system design options based on annual consumption
 * 
 * @param annualConsumptionKwh - Annual electricity consumption in kWh
 * @param sunFactor - Adjustment factor for sun exposure (0.7-1.15)
 * @param stateForIncentives - State for incentive lookup (optional)
 * @param roofAreaSqft - Roof area in sqft for constraining system size
 * @returns Array of 3 system options (conservative, standard, aggressive)
 */
export function generateSystemDesignOptions(
  annualConsumptionKwh: number,
  sunFactor: number = 1.0,
  stateForIncentives?: string,
  roofAreaSqft?: number
): SystemDesignOption[] {
  const adjustedProduction = annualConsumptionKwh / sunFactor;

  // Roof constraint: ~54 sq ft per kW, ~60% usable area
  const roofMaxKw = roofAreaSqft && roofAreaSqft > 0
    ? (roofAreaSqft * 0.6) / 54
    : Infinity;

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
    let systemSizeKw = targetProduction / AVG_PRODUCTION_PER_KW;

    // Apply roof constraint
    if (roofMaxKw < Infinity) {
      systemSizeKw = Math.min(systemSizeKw, roofMaxKw);
    }

    const systemCost = FIXED_INSTALL_OVERHEAD + systemSizeKw * 1000 * SYSTEM_COST_PER_WATT;

    // Production metrics
    const annualProduction = systemSizeKw * AVG_PRODUCTION_PER_KW * sunFactor;
    const actualCoverage = (annualProduction / annualConsumptionKwh) * 100;

    // Financial metrics
    const firstYearSavings = annualProduction * BASE_ELECTRICITY_RATE;

    // Loan calculation (10% down to match solar.ts)
    const loanDownPayment = systemCost * 0.10;
    const loanPrincipal = systemCost - loanDownPayment;
    const monthlyPayment = calculateMonthlyPayment(
      loanPrincipal,
      LOAN_INTEREST_RATE,
      LOAN_TERM_YEARS
    );

    // --- Savings helper: matches CashFlowChart / calculateFinancing ---
    // Linear degradation + rate escalation (year is 1-based)
    function savingsForYear(year: number): number {
      const escalation = Math.pow(1 + RATE_ESCALATION, year);
      const degradation = Math.max(0, 1 - year * PANEL_DEGRADATION);
      return firstYearSavings * escalation * degradation;
    }

    // ROI calculation (25-year)
    let totalSavings = 0;
    for (let year = 1; year <= 25; year++) {
      totalSavings += savingsForYear(year);
    }

    const roi25Year = ((totalSavings - systemCost) / systemCost) * 100;

    // Payback period (cash purchase: when cumulative savings >= system cost)
    let cumulativeSavings = 0;
    let paybackYearsResult = 25.0;
    for (let y = 1; y <= 25; y++) {
      const ys = savingsForYear(y);
      cumulativeSavings += ys;
      if (cumulativeSavings >= systemCost) {
        const prev = cumulativeSavings - ys;
        paybackYearsResult = (y - 1) + (systemCost - prev) / ys;
        break;
      }
    }

    return {
      name: names[idx],
      description: descriptions[idx],
      systemSizeKw: Math.round(systemSizeKw * 10) / 10,
      percentageOfConsumption: Math.round(actualCoverage),
      estimatedAnnualProduction: Math.round(annualProduction),
      systemCostUSD: Math.round(systemCost),
      monthlyPaymentLoan: Math.round(monthlyPayment),
      firstYearSavings: Math.round(firstYearSavings),
      paybackYears: Math.round(paybackYearsResult * 10) / 10,
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
