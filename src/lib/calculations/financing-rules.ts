/**
 * Financing Rules Engine
 * Determines financing availability by state and credit score
 * 
 * Rules:
 * - Cash: Always available
 * - Loan: Available if credit score ≥ 650 (credit score adjustment applies)
 * - Lease: Only in 20 specific states
 * - PPA: Only in 4 specific states (CA, AZ, NV, UT)
 */

import type {
  FinancingOptionType,
  FinancingAvailability,
  StateFinancingRules,
  CreditScoreBracket,
  FinancingEligibility,
  FinancingRulesConfig,
  LeaseAvailability,
  PPAAvailability,
} from '../../../types/financing-rules';
import {
  CREDIT_SCORE_BRACKETS,
  LEASE_AVAILABLE_STATES,
  PPA_AVAILABLE_STATES,
  LOAN_DEFAULTS,
} from '../../../types/financing-rules';

/**
 * Get credit score bracket
 */
export function getCreditScoreBracket(creditScore: number): CreditScoreBracket {
  for (const bracket of CREDIT_SCORE_BRACKETS) {
    if (creditScore >= bracket.minScore && creditScore <= bracket.maxScore) {
      return bracket;
    }
  }
  // Default to excellent if over 850
  return CREDIT_SCORE_BRACKETS[CREDIT_SCORE_BRACKETS.length - 1];
}

/**
 * Calculate APR based on credit score
 */
export function calculateAPR(creditScore: number = 700): number {
  const bracket = getCreditScoreBracket(creditScore);
  const adjustedAPR = LOAN_DEFAULTS.aprBase + bracket.aprAdjustment;
  // APR cannot go below 0 or above 12%
  return Math.max(0, Math.min(12, adjustedAPR));
}

/**
 * Check if lease is available in state
 */
export function isLeaseAvailable(stateCode: string): boolean {
  return LEASE_AVAILABLE_STATES.includes(stateCode.toUpperCase());
}

/**
 * Check if PPA is available in state
 */
export function isPPAAvailable(stateCode: string): boolean {
  return PPA_AVAILABLE_STATES.includes(stateCode.toUpperCase());
}

/**
 * Check if loan is available (credit score requirement)
 */
export function isLoanAvailable(creditScore: number = 700): boolean {
  return creditScore >= 650;
}

/**
 * Check if cash is available (always true)
 */
export function isCashAvailable(): boolean {
  return true;
}

/**
 * Get financing eligibility for a state and credit score
 */
export function getFinancingEligibility(config: FinancingRulesConfig): FinancingEligibility {
  const creditScore = config.creditScore ?? 700;
  const stateCode = config.state.toUpperCase();

  const availableOptions: FinancingOptionType[] = [];
  const unavailableOptions: { option: FinancingOptionType; reason: string }[] = [];

  // Cash - always available
  if (isCashAvailable()) {
    availableOptions.push('cash');
  }

  // Loan - requires credit score ≥ 650
  if (isLoanAvailable(creditScore)) {
    availableOptions.push('loan');
  } else {
    unavailableOptions.push({
      option: 'loan',
      reason: `Credit score ${creditScore} is below minimum 650. Minimum loan available at 600-649 score with higher APR.`,
    });
  }

  // Lease - only in specific states
  if (isLeaseAvailable(stateCode)) {
    availableOptions.push('lease');
  } else {
    unavailableOptions.push({
      option: 'lease',
      reason: `Solar leasing not available in ${config.state}. Only available in 20 states: CA, AZ, NY, TX, MA, IL, CT, FL, CO, HI, MD, ME, MN, NC, NH, NJ, NV, UT, WA, DE.`,
    });
  }

  // PPA - only in specific states
  if (isPPAAvailable(stateCode)) {
    availableOptions.push('ppa');
  } else {
    unavailableOptions.push({
      option: 'ppa',
      reason: `Power Purchase Agreements not available in ${config.state}. Only available in: CA, AZ, NV, UT.`,
    });
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (availableOptions.length === 1) {
    recommendations.push(`Only cash option available in ${config.state}.`);
  } else if (creditScore < 650) {
    recommendations.push('Improve credit score to 650+ for loan access.');
  } else if (creditScore < 700) {
    recommendations.push('Your credit score may qualify for loans, but with higher APR. Consider improving score.');
  }

  if (!isLeaseAvailable(stateCode) && !isPPAAvailable(stateCode)) {
    recommendations.push(`Consider cash or loan financing for ${config.state}.`);
  }

  if (creditScore >= 750) {
    recommendations.push('Excellent credit score! You qualify for premium loan rates.');
  }

  return {
    state: config.state,
    creditScore,
    availableOptions,
    unavailableOptions,
    recommendations,
  };
}

/**
 * Get state financing rules
 */
export function getStateFinancingRules(stateCode: string, creditScore: number = 700): StateFinancingRules {
  const state = stateCode.toUpperCase();
  const apr = calculateAPR(creditScore);

  const options: FinancingAvailability[] = [
    {
      option: 'cash',
      available: true,
    },
    {
      option: 'loan',
      available: isLoanAvailable(creditScore),
      minCreditScore: 650,
      notes: creditScore < 650 ? 'Credit score below minimum' : undefined,
    },
    {
      option: 'lease',
      available: isLeaseAvailable(state),
      states: LEASE_AVAILABLE_STATES,
      notes: isLeaseAvailable(state) ? undefined : 'Not available in this state',
    },
    {
      option: 'ppa',
      available: isPPAAvailable(state),
      states: PPA_AVAILABLE_STATES,
      notes: isPPAAvailable(state) ? undefined : 'Not available in this state',
    },
  ];

  return {
    state: stateCode,
    stateCode: state,
    options,
    loanAprBase: LOAN_DEFAULTS.aprBase,
    loanTermYears: LOAN_DEFAULTS.termYears,
    loanDownPaymentPercent: LOAN_DEFAULTS.downPaymentPercent,
  };
}

/**
 * Compare financing options available across all states
 */
export function compareStateFinancing(creditScore: number = 700): Record<string, FinancingOptionType[]> {
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  const comparison: Record<string, FinancingOptionType[]> = {};

  for (const state of states) {
    const eligibility = getFinancingEligibility({
      state,
      creditScore,
      systemSize: 8,
      systemCost: 22000,
    });
    comparison[state] = eligibility.availableOptions;
  }

  return comparison;
}

/**
 * Get states with most financing options
 */
export function getTopFinancingStates(): string[] {
  // States with all 4 options available
  const topStates: string[] = [];

  for (const state of PPA_AVAILABLE_STATES) {
    // PPA states automatically have all 4 (they're subset of lease states)
    topStates.push(state);
  }

  return topStates.sort();
}

/**
 * Get financing summary for a state
 */
export function getFinancingSummary(state: string, creditScore: number = 700): {
  state: string;
  creditScore: number;
  creditLabel: string;
  apr: number;
  availableCount: number;
  hasCash: boolean;
  hasLoan: boolean;
  hasLease: boolean;
  hasPPA: boolean;
} {
  const bracket = getCreditScoreBracket(creditScore);
  const eligibility = getFinancingEligibility({
    state,
    creditScore,
    systemSize: 8,
    systemCost: 22000,
  });

  return {
    state,
    creditScore,
    creditLabel: bracket.label,
    apr: calculateAPR(creditScore),
    availableCount: eligibility.availableOptions.length,
    hasCash: eligibility.availableOptions.includes('cash'),
    hasLoan: eligibility.availableOptions.includes('loan'),
    hasLease: eligibility.availableOptions.includes('lease'),
    hasPPA: eligibility.availableOptions.includes('ppa'),
  };
}

/**
 * Loan availability by credit score ranges
 * Shows tier-based access
 */
export function getLoanAvailabilityByScore(creditScore: number): {
  isAvailable: boolean;
  tier: string;
  apr: number;
  message: string;
} {
  if (creditScore < 550) {
    return {
      isAvailable: false,
      tier: 'none',
      apr: 0,
      message: 'Poor credit - loan not available. Build credit to 550+.',
    };
  } else if (creditScore < 650) {
    return {
      isAvailable: false,
      tier: 'unavailable',
      apr: 0,
      message: `Fair credit (${creditScore}) - loan requires 650+. Reach 650+ to access financing.`,
    };
  } else if (creditScore < 700) {
    return {
      isAvailable: true,
      tier: 'good',
      apr: calculateAPR(creditScore),
      message: `Good credit (${creditScore}) - loan available at ${calculateAPR(creditScore).toFixed(2)}% APR.`,
    };
  } else if (creditScore < 750) {
    return {
      isAvailable: true,
      tier: 'very-good',
      apr: calculateAPR(creditScore),
      message: `Very good credit (${creditScore}) - loan available at ${calculateAPR(creditScore).toFixed(2)}% APR.`,
    };
  } else {
    return {
      isAvailable: true,
      tier: 'excellent',
      apr: calculateAPR(creditScore),
      message: `Excellent credit (${creditScore}) - best loan rates at ${calculateAPR(creditScore).toFixed(2)}% APR.`,
    };
  }
}

/**
 * Get lease availability detail
 */
export function getLeaseAvailabilityDetail(stateCode: string): LeaseAvailability {
  const code = stateCode.toUpperCase();
  const available = isLeaseAvailable(code);

  return {
    state: stateCode,
    stateCode: code,
    hasLeasePrograms: available,
    providers: available ? ['Sunrun', 'Vivint Solar', 'Local Providers'] : undefined,
    notes: available
      ? `Solar leasing available in ${stateCode}`
      : `Solar leasing not available in ${stateCode}. Consider cash or loan options.`,
  };
}

/**
 * Get PPA availability detail
 */
export function getPPAAvailabilityDetail(stateCode: string): PPAAvailability {
  const code = stateCode.toUpperCase();
  const available = isPPAAvailable(code);

  return {
    state: stateCode,
    stateCode: code,
    hasPPAPrograms: available,
    providers: available ? ['Sunrun', 'Vivint Solar', 'Mosaic'] : undefined,
    notes: available
      ? `Power Purchase Agreements available in ${stateCode}`
      : `PPAs not available in ${stateCode}. Consider lease or other options.`,
  };
}

/**
 * Count states by available financing options
 */
export function countStatesByOptions(): {
  allFour: number;
  threeOptions: number;
  twoOptions: number;
  onlyLoan: number;
  onlyCash: number;
} {
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  let allFour = 0;
  let threeOptions = 0;
  let twoOptions = 0;
  let onlyLoan = 0;
  let onlyCash = 0;

  for (const state of states) {
    const eligibility = getFinancingEligibility({
      state,
      creditScore: 700,
      systemSize: 8,
      systemCost: 22000,
    });

    const count = eligibility.availableOptions.length;
    if (count === 4) allFour++;
    else if (count === 3) threeOptions++;
    else if (count === 2) twoOptions++;
    else if (count === 1) onlyLoan++;
    else onlyCash++;
  }

  return {
    allFour,
    threeOptions,
    twoOptions,
    onlyLoan,
    onlyCash,
  };
}
