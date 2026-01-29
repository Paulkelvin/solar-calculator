/**
 * Financing Rules Type Definitions
 * Regional financing availability and eligibility rules
 */

export type FinancingOptionType = 'cash' | 'loan' | 'lease' | 'ppa';

/**
 * Financing option availability
 */
export interface FinancingAvailability {
  option: FinancingOptionType;
  available: boolean;
  minCreditScore?: number;
  maxCreditScore?: number;
  states?: string[]; // null = all states, array = specific states only
  notes?: string;
}

/**
 * State financing rules
 */
export interface StateFinancingRules {
  state: string;
  stateCode: string;
  options: FinancingAvailability[];
  loanAprBase: number; // Base APR (before credit score adjustment)
  loanTermYears: number;
  loanDownPaymentPercent: number;
}

/**
 * Credit score bracket
 */
export interface CreditScoreBracket {
  minScore: number;
  maxScore: number;
  aprAdjustment: number; // APR modifier (e.g., 0 = no change, +0.5 = +0.5%)
  label: string; // 'Poor', 'Fair', 'Good', 'Excellent'
}

/**
 * Financing eligibility result
 */
export interface FinancingEligibility {
  state: string;
  creditScore: number;
  availableOptions: FinancingOptionType[];
  unavailableOptions: { option: FinancingOptionType; reason: string }[];
  recommendations: string[];
}

/**
 * Lease program availability by state
 */
export interface LeaseAvailability {
  state: string;
  stateCode: string;
  hasLeasePrograms: boolean;
  providers?: string[]; // Companies offering leases
  notes?: string;
}

/**
 * PPA program availability by state
 */
export interface PPAAvailability {
  state: string;
  stateCode: string;
  hasPPAPrograms: boolean;
  providers?: string[]; // Companies offering PPAs
  notes?: string;
}

/**
 * Financing rules configuration
 */
export interface FinancingRulesConfig {
  state: string;
  creditScore?: number; // null = default (700)
  systemSize: number;
  systemCost: number;
}

/**
 * Credit score APR brackets
 */
export const CREDIT_SCORE_BRACKETS: CreditScoreBracket[] = [
  {
    minScore: 300,
    maxScore: 549,
    aprAdjustment: 3.5,
    label: 'Poor',
  },
  {
    minScore: 550,
    maxScore: 649,
    aprAdjustment: 2.0,
    label: 'Fair',
  },
  {
    minScore: 650,
    maxScore: 699,
    aprAdjustment: 0.5,
    label: 'Good',
  },
  {
    minScore: 700,
    maxScore: 749,
    aprAdjustment: 0,
    label: 'Good+',
  },
  {
    minScore: 750,
    maxScore: 799,
    aprAdjustment: -0.5,
    label: 'Very Good',
  },
  {
    minScore: 800,
    maxScore: 850,
    aprAdjustment: -1.0,
    label: 'Excellent',
  },
];

/**
 * States with lease programs available
 * Only 20 states have solar lease options
 */
export const LEASE_AVAILABLE_STATES = [
  'AZ', // Arizona
  'CA', // California
  'CT', // Connecticut
  'CO', // Colorado
  'DE', // Delaware
  'FL', // Florida
  'HI', // Hawaii
  'IL', // Illinois
  'MA', // Massachusetts
  'MD', // Maryland
  'ME', // Maine
  'MN', // Minnesota
  'NC', // North Carolina
  'NH', // New Hampshire
  'NJ', // New Jersey
  'NV', // Nevada
  'NY', // New York
  'TX', // Texas
  'UT', // Utah
  'WA', // Washington
];

/**
 * States with PPA programs available
 * Only 4 states have solar PPA options
 */
export const PPA_AVAILABLE_STATES = [
  'AZ', // Arizona
  'CA', // California
  'NV', // Nevada
  'UT', // Utah
];

/**
 * Base loan APR before credit adjustment
 */
export const LOAN_APR_BASE = 6.5;

/**
 * Standard loan terms
 */
export const LOAN_DEFAULTS = {
  termYears: 25,
  downPaymentPercent: 20,
  aprBase: LOAN_APR_BASE,
};
