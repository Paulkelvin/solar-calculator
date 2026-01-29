/**
 * Tax Credits Type Definitions
 * Federal ITC + State-specific solar tax credits
 */

/**
 * Federal Investment Tax Credit (ITC)
 * 30% through 2032, then phases down
 */
export interface FederalITC {
  year: number;
  rate: number; // 0.30 (2024-2026), 0.26 (2027-2028), 0.22 (2029+)
  maxAmount?: number; // No cap for residential
}

/**
 * State-specific solar tax credit
 */
export interface StateTaxCredit {
  state: string;
  stateCode: string;
  rate: number; // Percentage (0.15 = 15%)
  maxAmount?: number; // Per installation cap
  description: string;
  startYear: number;
  endYear?: number; // null = indefinite
  requiresFederal?: boolean; // Must claim federal first
  notes?: string;
}

/**
 * Tax credit calculation result
 */
export interface TaxCreditResult {
  systemCostBeforeTax: number;
  federalRate: number;
  federalCredit: number;
  federalMaxCap?: number;
  stateRate: number;
  stateCredit: number;
  stateMaxCap?: number;
  totalTaxCredit: number;
  netSystemCost: number; // Cost after credits
  payoffReduction: number; // Years saved by tax credits
  roi_with_credits: number; // Updated ROI after credits
}

/**
 * Tax credit configuration
 */
export interface TaxCreditConfig {
  systemCostBeforeTax: number;
  state: string;
  year: number;
  creditScore?: number; // May affect eligibility
  incomeLevel?: number; // For future low-income programs
}

/**
 * Complete tax credits database for 50 US states
 * Updated for 2024 tax year
 */
export const STATE_TAX_CREDITS: Record<string, StateTaxCredit> = {
  AL: { state: 'Alabama', stateCode: 'AL', rate: 0, description: 'No state tax credit', startYear: 2024 },
  AK: { state: 'Alaska', stateCode: 'AK', rate: 0, description: 'No state tax credit', startYear: 2024 },
  AZ: { state: 'Arizona', stateCode: 'AZ', rate: 0.25, maxAmount: 1000, description: '25% up to $1,000', startYear: 2024, endYear: 2026 },
  AR: { state: 'Arkansas', stateCode: 'AR', rate: 0, description: 'No state tax credit', startYear: 2024 },
  CA: { state: 'California', stateCode: 'CA', rate: 0.15, maxAmount: 3000, description: '15% up to $3,000 (existing home)', startYear: 2024 },
  CO: { state: 'Colorado', stateCode: 'CO', rate: 0.10, maxAmount: 2000, description: '10% up to $2,000', startYear: 2024, endYear: 2025 },
  CT: { state: 'Connecticut', stateCode: 'CT', rate: 0.25, maxAmount: 5625, description: '25% up to $5,625', startYear: 2024 },
  DE: { state: 'Delaware', stateCode: 'DE', rate: 0.10, maxAmount: 3750, description: '10% up to $3,750', startYear: 2024 },
  FL: { state: 'Florida', stateCode: 'FL', rate: 0, description: 'No state tax credit', startYear: 2024 },
  GA: { state: 'Georgia', stateCode: 'GA', rate: 0.30, maxAmount: 6700, description: '30% up to $6,700 (res)', startYear: 2024 },
  HI: { state: 'Hawaii', stateCode: 'HI', rate: 0.35, maxAmount: 5000, description: '35% up to $5,000', startYear: 2024 },
  ID: { state: 'Idaho', stateCode: 'ID', rate: 0, description: 'No state tax credit', startYear: 2024 },
  IL: { state: 'Illinois', stateCode: 'IL', rate: 0.30, maxAmount: 9000, description: '30% up to $9,000', startYear: 2024 },
  IN: { state: 'Indiana', stateCode: 'IN', rate: 0, description: 'No state tax credit', startYear: 2024 },
  IA: { state: 'Iowa', stateCode: 'IA', rate: 0, description: 'No state tax credit', startYear: 2024 },
  KS: { state: 'Kansas', stateCode: 'KS', rate: 0, description: 'No state tax credit', startYear: 2024 },
  KY: { state: 'Kentucky', stateCode: 'KY', rate: 0, description: 'No state tax credit', startYear: 2024 },
  LA: { state: 'Louisiana', stateCode: 'LA', rate: 0, description: 'No state tax credit', startYear: 2024 },
  ME: { state: 'Maine', stateCode: 'ME', rate: 0.30, maxAmount: 6000, description: '30% up to $6,000', startYear: 2024 },
  MD: { state: 'Maryland', stateCode: 'MD', rate: 0.20, maxAmount: 5000, description: '20% up to $5,000', startYear: 2024 },
  MA: { state: 'Massachusetts', stateCode: 'MA', rate: 0.15, maxAmount: 1000, description: '15% up to $1,000', startYear: 2024 },
  MI: { state: 'Michigan', stateCode: 'MI', rate: 0, description: 'No state tax credit', startYear: 2024 },
  MN: { state: 'Minnesota', stateCode: 'MN', rate: 0.30, maxAmount: 5850, description: '30% up to $5,850', startYear: 2024 },
  MS: { state: 'Mississippi', stateCode: 'MS', rate: 0, description: 'No state tax credit', startYear: 2024 },
  MO: { state: 'Missouri', stateCode: 'MO', rate: 0, description: 'No state tax credit', startYear: 2024 },
  MT: { state: 'Montana', stateCode: 'MT', rate: 0.15, maxAmount: 3000, description: '15% up to $3,000', startYear: 2024 },
  NE: { state: 'Nebraska', stateCode: 'NE', rate: 0, description: 'No state tax credit', startYear: 2024 },
  NV: { state: 'Nevada', stateCode: 'NV', rate: 0.10, maxAmount: 2000, description: '10% up to $2,000', startYear: 2024 },
  NH: { state: 'New Hampshire', stateCode: 'NH', rate: 0.30, maxAmount: 5000, description: '30% up to $5,000', startYear: 2024 },
  NJ: { state: 'New Jersey', stateCode: 'NJ', rate: 0.10, maxAmount: 2700, description: '10% up to $2,700', startYear: 2024 },
  NM: { state: 'New Mexico', stateCode: 'NM', rate: 0.10, maxAmount: 3000, description: '10% up to $3,000', startYear: 2024 },
  NY: { state: 'New York', stateCode: 'NY', rate: 0.25, maxAmount: 5625, description: '25% up to $5,625', startYear: 2024 },
  NC: { state: 'North Carolina', stateCode: 'NC', rate: 0.30, maxAmount: 6700, description: '30% up to $6,700', startYear: 2024, endYear: 2024 },
  ND: { state: 'North Dakota', stateCode: 'ND', rate: 0, description: 'No state tax credit', startYear: 2024 },
  OH: { state: 'Ohio', stateCode: 'OH', rate: 0, description: 'No state tax credit', startYear: 2024 },
  OK: { state: 'Oklahoma', stateCode: 'OK', rate: 0, description: 'No state tax credit', startYear: 2024 },
  OR: { state: 'Oregon', stateCode: 'OR', rate: 0.10, maxAmount: 1500, description: '10% up to $1,500', startYear: 2024 },
  PA: { state: 'Pennsylvania', stateCode: 'PA', rate: 0, description: 'No state tax credit', startYear: 2024 },
  RI: { state: 'Rhode Island', stateCode: 'RI', rate: 0.25, maxAmount: 3500, description: '25% up to $3,500', startYear: 2024 },
  SC: { state: 'South Carolina', stateCode: 'SC', rate: 0.30, maxAmount: 6700, description: '30% up to $6,700', startYear: 2024, endYear: 2024 },
  SD: { state: 'South Dakota', stateCode: 'SD', rate: 0, description: 'No state tax credit', startYear: 2024 },
  TN: { state: 'Tennessee', stateCode: 'TN', rate: 0, description: 'No state tax credit', startYear: 2024 },
  TX: { state: 'Texas', stateCode: 'TX', rate: 0, description: 'No state tax credit', startYear: 2024 },
  UT: { state: 'Utah', stateCode: 'UT', rate: 0.25, maxAmount: 2000, description: '25% up to $2,000', startYear: 2024, endYear: 2027 },
  VT: { state: 'Vermont', stateCode: 'VT', rate: 0.30, maxAmount: 6000, description: '30% up to $6,000', startYear: 2024 },
  VA: { state: 'Virginia', stateCode: 'VA', rate: 0, description: 'No state tax credit', startYear: 2024 },
  WA: { state: 'Washington', stateCode: 'WA', rate: 0, description: 'No state tax credit', startYear: 2024 },
  WV: { state: 'West Virginia', stateCode: 'WV', rate: 0, description: 'No state tax credit', startYear: 2024 },
  WI: { state: 'Wisconsin', stateCode: 'WI', rate: 0.10, maxAmount: 2000, description: '10% up to $2,000', startYear: 2024 },
  WY: { state: 'Wyoming', stateCode: 'WY', rate: 0, description: 'No state tax credit', startYear: 2024 },
};

/**
 * Federal ITC rates by year
 */
export const FEDERAL_ITC_SCHEDULE: Record<number, number> = {
  2024: 0.30,
  2025: 0.30,
  2026: 0.30,
  2027: 0.26,
  2028: 0.26,
  2029: 0.22,
  2030: 0.22,
  2031: 0.22,
  2032: 0.22,
};

/**
 * Get federal ITC rate for given year
 */
export function getFederalITCRate(year: number): number {
  return FEDERAL_ITC_SCHEDULE[year] ?? 0.30; // Default to 30% if year not found
}

/**
 * Get state tax credit for given state
 */
export function getStateTaxCredit(stateCode: string): StateTaxCredit | null {
  return STATE_TAX_CREDITS[stateCode.toUpperCase()] ?? null;
}

/**
 * Check if state has tax credit
 */
export function hasStateTaxCredit(stateCode: string): boolean {
  const credit = getStateTaxCredit(stateCode);
  return credit !== null && credit.rate > 0;
}
