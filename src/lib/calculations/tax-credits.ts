/**
 * Tax Credits Calculation Engine
 * 
 * ⚠️ Federal 30% ITC is DISCONTINUED (expired Dec 31, 2025).
 * Only state-level tax credits remain active.
 * Federal ITC functions return 0 for all years.
 */

import {
  FederalITC,
  StateTaxCredit,
  TaxCreditResult,
  TaxCreditConfig,
  getFederalITCRate,
  getStateTaxCredit,
} from '../../../types/tax-credits';

/**
 * Calculate Federal Investment Tax Credit.
 * ⚠️ DISCONTINUED — always returns 0. Federal ITC expired Dec 31, 2025.
 */
export function calculateFederalITC(
  systemCost: number,
  year: number = new Date().getFullYear()
): { rate: number; credit: number } {
  // Federal ITC discontinued — no credit available
  return { rate: 0, credit: 0 };
}

/**
 * Calculate state-specific tax credit
 * Rates and caps vary by state
 * Most states cap the credit amount
 */
export function calculateStateTaxCredit(
  systemCost: number,
  stateCode: string,
  federalCredit: number = 0
): { rate: number; credit: number; maxCap?: number; capped: boolean } {
  const stateCredit = getStateTaxCredit(stateCode);

  if (!stateCredit || stateCredit.rate === 0) {
    return { rate: 0, credit: 0, capped: false };
  }

  // Some states cap credit based on net cost (after federal)
  const baseForCalculation = stateCredit.requiresFederal 
    ? Math.max(systemCost - federalCredit, 0)
    : systemCost;

  let calculatedCredit = baseForCalculation * stateCredit.rate;
  let capped = false;

  // Apply state maximum if exists
  if (stateCredit.maxAmount && calculatedCredit > stateCredit.maxAmount) {
    calculatedCredit = stateCredit.maxAmount;
    capped = true;
  }

  return {
    rate: stateCredit.rate,
    credit: calculatedCredit,
    maxCap: stateCredit.maxAmount,
    capped,
  };
}

/**
 * Calculate total tax credits (federal + state).
 * Returns detailed breakdown for display.
 */
export function calculateTotalTaxCredits(
  config: TaxCreditConfig
): TaxCreditResult {
  const { systemCostBeforeTax, state, year } = config;

  // Step 1: Federal ITC (uses year-based schedule)
  const federal = calculateFederalITC(systemCostBeforeTax, year);

  // Step 2: Calculate state tax credit
  const stateTax = calculateStateTaxCredit(
    systemCostBeforeTax,
    state,
    federal.credit
  );

  // Step 3: Calculate totals
  const totalTaxCredit = federal.credit + stateTax.credit;
  const netSystemCost = Math.max(systemCostBeforeTax - totalTaxCredit, 0);

  // Step 4: Estimate payoff reduction
  // Each $1 of tax credit reduces payoff by ~1-1.5 years (depending on savings)
  // Simplified: 1 year reduction per $6,000 of credits
  const estimatedYearlyROI = 1800; // Typical $150-200/month savings
  const payoffReduction = totalTaxCredit / estimatedYearlyROI;

  // Step 5: Updated ROI calculation
  // ROI improves because net cost is lower
  // ROI = (Annual Savings × 25 years) / Net Cost × 100
  const totalEstimatedSavings = estimatedYearlyROI * 25;
  const roi_with_credits = netSystemCost > 0 
    ? (totalEstimatedSavings / netSystemCost) * 100
    : 999; // Essentially free

  return {
    systemCostBeforeTax,
    federalRate: federal.rate,
    federalCredit: federal.credit,
    stateRate: stateTax.rate,
    stateCredit: stateTax.credit,
    stateMaxCap: stateTax.maxCap,
    totalTaxCredit,
    netSystemCost,
    payoffReduction: Math.round(payoffReduction * 10) / 10,
    roi_with_credits: Math.round(roi_with_credits),
  };
}

/**
 * Format tax credit for display
 */
export function formatTaxCreditDisplay(result: TaxCreditResult): string {
  const federal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(result.federalCredit);

  const state = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(result.stateCredit);

  const total = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(result.totalTaxCredit);

  if (result.stateCredit === 0) {
    return `No federal or state tax credits available. Total Benefit: ${total}`;
  }

  return `State Credit: ${state} | Total Benefit: ${total}`;
}

/**
 * Get breakdown text for all 50 states
 * Returns explanation of available credits
 */
export function getTaxCreditBreakdownText(
  stateCode: string,
  year: number = new Date().getFullYear()
): string {
  const federal = getFederalITCRate(year);
  const stateCredit = getStateTaxCredit(stateCode);

  if (!stateCredit || stateCredit.rate === 0) {
    return `No federal or state tax credits currently available.`;
  }

  const statePercent = (stateCredit.rate * 100).toFixed(0);
  const maxCap = stateCredit.maxAmount
    ? ` (max ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(stateCredit.maxAmount)})`
    : '';

  return `${stateCredit.state} Tax Credit: ${statePercent}%${maxCap}. State-level benefit up to ${(stateCredit.rate * 100).toFixed(0)}% of system cost.`;
}

/**
 * Check if state credit is expiring soon
 */
export function isStateCreditExpiring(
  stateCode: string,
  threshold: number = 1
): boolean {
  const credit = getStateTaxCredit(stateCode);
  if (!credit || !credit.endYear) return false;

  const currentYear = new Date().getFullYear();
  return credit.endYear - currentYear <= threshold;
}

/**
 * Calculate impact of tax credits on system payoff
 * Shows break-even analysis with and without credits
 */
export function calculatePayoffWithCredits(
  systemCost: number,
  annualSavings: number,
  taxCreditResult: TaxCreditResult
): { withCredits: number; withoutCredits: number; yearsReduced: number } {
  const withoutCredits = systemCost / annualSavings;
  const withCredits = taxCreditResult.netSystemCost / annualSavings;

  return {
    withCredits: Math.round(withCredits * 10) / 10,
    withoutCredits: Math.round(withoutCredits * 10) / 10,
    yearsReduced: Math.round((withoutCredits - withCredits) * 10) / 10,
  };
}

/**
 * Estimate total savings with tax credits factored in
 */
export function estimateTotalSavings(
  systemCost: number,
  annualSavings: number,
  years: number = 25,
  taxCreditResult?: TaxCreditResult
): {
  grossSavings: number;
  taxCredits: number;
  totalBenefit: number;
  breakEvenYear: number;
} {
  const grossSavings = annualSavings * years;
  const taxCredits = taxCreditResult?.totalTaxCredit ?? 0;
  const totalBenefit = grossSavings + taxCredits;

  // When does investment pay off?
  const netCost = taxCreditResult?.netSystemCost ?? systemCost;
  const breakEvenYear = Math.ceil(netCost / annualSavings);

  return {
    grossSavings: Math.round(grossSavings),
    taxCredits: Math.round(taxCredits),
    totalBenefit: Math.round(totalBenefit),
    breakEvenYear,
  };
}

/**
 * Get summary for all 50 states
 * Returns max possible benefit by state
 */
export function getAllStateTaxCreditsSummary(): Record<string, {
  state: string;
  maxFederal: number;
  maxState: number;
  maxTotal: number;
  description: string;
}> {
  const result: Record<string, any> = {};

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  // Assume $22,000 system cost for comparability
  const sampleCost = 22000;

  for (const stateCode of states) {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: sampleCost,
      state: stateCode,
      year: 2024,
    };

    const credits = calculateTotalTaxCredits(config);
    const stateCredit = getStateTaxCredit(stateCode);

    result[stateCode] = {
      state: stateCredit?.state ?? stateCode,
      maxFederal: 0, // Federal ITC discontinued
      maxState: Math.round(credits.stateCredit),
      maxTotal: Math.round(credits.totalTaxCredit),
      description: stateCredit?.description ?? 'No state tax credit',
    };
  }

  return result;
}
