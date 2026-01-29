/**
 * Credit Score Integration Layer
 * Integrates credit score with financing rules to filter options and calculate APR
 */

import type { CalculatorForm } from '../../../types';
import {
  getFinancingEligibility,
  calculateAPR,
  getCreditScoreBracket,
  getLoanAvailabilityByScore,
} from './financing-rules';

/**
 * Enhanced calculator result with financing details
 */
export interface CreditScoreIntegration {
  creditScore: number;
  creditBracket: string;
  apr: number;
  availableFinancingOptions: ('cash' | 'loan' | 'lease' | 'ppa')[];
  financingRecommendation: string;
  loanEligibility: {
    available: boolean;
    tier: string;
    message: string;
  };
}

/**
 * Get credit score integration details
 */
export function getCreditScoreIntegration(
  stateCode: string,
  creditScore: number = 700,
  systemSize: number,
  systemCost: number
): CreditScoreIntegration {
  const bracket = getCreditScoreBracket(creditScore);
  const apr = calculateAPR(creditScore);
  const eligibility = getFinancingEligibility({
    state: stateCode,
    creditScore,
    systemSize,
    systemCost,
  });
  const loanAvail = getLoanAvailabilityByScore(creditScore);

  // Determine primary recommendation
  let financingRecommendation = 'Financing options available.';
  if (eligibility.availableOptions.length === 1) {
    financingRecommendation = `Only cash purchase available in ${stateCode}.`;
  } else if (eligibility.availableOptions.includes('loan') && creditScore >= 750) {
    financingRecommendation = `Excellent credit! Best available APR: ${apr.toFixed(2)}%`;
  } else if (!eligibility.availableOptions.includes('loan')) {
    financingRecommendation = 'Improve credit to 650+ for financing options.';
  }

  return {
    creditScore,
    creditBracket: bracket.label,
    apr,
    availableFinancingOptions: eligibility.availableOptions,
    financingRecommendation,
    loanEligibility: {
      available: loanAvail.isAvailable,
      tier: loanAvail.tier,
      message: loanAvail.message,
    },
  };
}

/**
 * Filter financing option by eligibility
 */
export function isFinancingOptionAvailable(
  option: 'cash' | 'loan' | 'lease' | 'ppa',
  state: string,
  creditScore: number = 700
): boolean {
  const eligibility = getFinancingEligibility({
    state,
    creditScore,
    systemSize: 8,
    systemCost: 22000,
  });
  return eligibility.availableOptions.includes(option);
}

/**
 * Get all available financing options for a lead
 */
export function getAvailableFinancingOptions(
  state: string,
  creditScore: number = 700
): ('cash' | 'loan' | 'lease' | 'ppa')[] {
  const eligibility = getFinancingEligibility({
    state,
    creditScore,
    systemSize: 8,
    systemCost: 22000,
  });
  return eligibility.availableOptions;
}

/**
 * Get reason why option is unavailable
 */
export function getUnavailableReason(
  option: 'cash' | 'loan' | 'lease' | 'ppa',
  state: string,
  creditScore: number = 700
): string | null {
  const eligibility = getFinancingEligibility({
    state,
    creditScore,
    systemSize: 8,
    systemCost: 22000,
  });

  const unavailable = eligibility.unavailableOptions.find((u) => u.option === option);
  return unavailable?.reason || null;
}

/**
 * Sort financing options by preference
 * Typically: Lease > PPA > Loan > Cash
 * This represents perceived value to installer (lease/PPA = highest margin)
 */
export function sortFinancingOptions(
  options: ('cash' | 'loan' | 'lease' | 'ppa')[]
): ('cash' | 'loan' | 'lease' | 'ppa')[] {
  const preference = { lease: 0, ppa: 1, loan: 2, cash: 3 };
  return [...options].sort((a, b) => preference[a] - preference[b]);
}

/**
 * Get credit score improvement path
 */
export function getCreditImprovementPath(
  currentScore: number
): {
  currentTier: string;
  nextTier: string;
  scoreNeeded: number;
  improvement: number;
  benefits: string[];
} {
  const bracket = getCreditScoreBracket(currentScore);
  const brackets = [
    { name: 'Poor', minScore: 300 },
    { name: 'Fair', minScore: 550 },
    { name: 'Good', minScore: 650 },
    { name: 'Good+', minScore: 700 },
    { name: 'Very Good', minScore: 750 },
    { name: 'Excellent', minScore: 800 },
  ];

  const currentIndex = brackets.findIndex((b) => b.name === bracket.label);

  if (currentIndex >= brackets.length - 1) {
    return {
      currentTier: bracket.label,
      nextTier: 'Excellent',
      scoreNeeded: 850,
      improvement: 0,
      benefits: ['You have excellent credit! Enjoy the best rates available.'],
    };
  }

  const nextTier = brackets[currentIndex + 1];
  const scoreNeeded = nextTier.minScore;
  const improvement = Math.max(0, scoreNeeded - currentScore);

  const benefits: string[] = [];
  if (currentScore < 550 && scoreNeeded >= 550) {
    benefits.push('Fair credit opens loan options');
  }
  if (currentScore < 650 && scoreNeeded >= 650) {
    benefits.push('Good credit makes you loan eligible');
  }
  if (currentScore < 700 && scoreNeeded >= 700) {
    benefits.push('Good+ tier gives standard APR rates');
  }
  if (currentScore < 750 && scoreNeeded >= 750) {
    benefits.push('Very good credit reduces APR by 0.5%');
  }
  if (currentScore < 800 && scoreNeeded >= 800) {
    benefits.push('Excellent credit unlocks best rates');
  }

  return {
    currentTier: bracket.label,
    nextTier: nextTier.name,
    scoreNeeded,
    improvement,
    benefits: benefits.length > 0 ? benefits : ['Continue building credit for better rates.'],
  };
}

/**
 * Calculate estimated APR range for state
 * Returns min and max APR based on credit score range
 */
export function getAPRRange(state: string): {
  minAPR: number;
  maxAPR: number;
  minScore: number;
  maxScore: number;
} {
  // Worst case: poor credit (300)
  const maxAPR = calculateAPR(300);
  // Best case: excellent credit (850)
  const minAPR = calculateAPR(850);

  return {
    minAPR,
    maxAPR,
    minScore: 850,
    maxScore: 300,
  };
}

/**
 * Build financing card display data
 * Filters and formats options for results page
 */
export function buildFinancingCardData(
  form: CalculatorForm,
  systemSize: number,
  systemCost: number,
  monthlyProduction: number
) {
  const state = form.address.state.toUpperCase();
  const creditScore = form.preferences.creditScore || 700;

  const integration = getCreditScoreIntegration(
    state,
    creditScore,
    systemSize,
    systemCost
  );

  // Calculate loan details if available
  let loanData = null;
  if (integration.availableFinancingOptions.includes('loan')) {
    const monthlyPayment = calculateMonthlyLoanPayment(
      systemCost,
      integration.apr,
      25 // 25 year term
    );

    const breakEvenMonths = Math.ceil(monthlyPayment / (monthlyProduction * 0.12)); // Assume $0.12/kWh saved

    loanData = {
      option: 'loan',
      available: true,
      apr: integration.apr,
      creditTier: integration.creditBracket,
      monthlyPayment,
      breakEvenMonths,
      estimatedSavings: monthlyProduction * 0.12 * 12 * 25 - systemCost, // 25 year savings
    };
  }

  // Cash is always available
  const cashData = {
    option: 'cash',
    available: true,
    upfrontCost: systemCost,
    estimatedSavings: monthlyProduction * 0.12 * 25,
    breakEvenMonths: Math.ceil(systemCost / (monthlyProduction * 0.12)),
  };

  return {
    creditScore,
    creditBracket: integration.creditBracket,
    apr: integration.apr,
    availableOptions: integration.availableFinancingOptions,
    financingRecommendation: integration.financingRecommendation,
    cards: {
      cash: integration.availableFinancingOptions.includes('cash') ? cashData : null,
      loan: loanData,
      lease: integration.availableFinancingOptions.includes('lease')
        ? {
            option: 'lease',
            available: true,
            downPayment: 0,
            monthlyPayment: systemCost / 300, // Rough estimate: cost / 300 months
          }
        : null,
      ppa: integration.availableFinancingOptions.includes('ppa')
        ? {
            option: 'ppa',
            available: true,
            downPayment: 0,
            monthlyPayment: (monthlyProduction * 0.12) / 0.8, // Pay 80% of production value
          }
        : null,
    },
  };
}

/**
 * Calculate monthly loan payment
 * Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
 * where P = principal, r = monthly rate, n = months
 */
export function calculateMonthlyLoanPayment(
  principal: number,
  annualAPR: number,
  years: number
): number {
  const monthlyRate = annualAPR / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    return principal / months;
  }

  const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  return (principal * numerator) / denominator;
}

/**
 * Get financing summary for lead scoring
 */
export function getFinancingScoreFactor(
  state: string,
  creditScore: number,
  financingType: string
): number {
  // Higher score for leads in multi-option states
  // Higher score for leads with loan eligibility
  // Incentivize quality leads (good credit + diverse options)

  const availableOptions = getAvailableFinancingOptions(state, creditScore);
  const optionScore = availableOptions.length * 0.25; // Max 1.0 for all 4 options

  let creditScore_factor = 0;
  if (creditScore >= 800) creditScore_factor = 0.5; // Excellent
  else if (creditScore >= 750) creditScore_factor = 0.4; // Very Good
  else if (creditScore >= 700) creditScore_factor = 0.3; // Good+
  else if (creditScore >= 650) creditScore_factor = 0.2; // Good
  else creditScore_factor = 0.1; // Fair/Poor

  const financingAvailable = availableOptions.includes(financingType as any) ? 1.0 : 0.5;

  return optionScore + creditScore_factor + financingAvailable * 0.25;
}
