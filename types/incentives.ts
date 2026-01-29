/**
 * State Incentives Type Definitions
 * Solar rebates, grants, tax exemptions, and property tax breaks
 * Updated for 2024 tax year
 */

export type IncentiveType = 'rebate' | 'grant' | 'tax-exemption' | 'property-tax' | 'sales-tax' | 'other';

/**
 * Solar incentive from state/utility
 */
export interface Incentive {
  id: string;
  state: string;
  stateCode: string;
  utility?: string; // null = statewide program
  incentiveType: IncentiveType;
  name: string;
  description?: string;
  amount: number; // Dollar amount or per-unit amount
  unit: 'dollars' | '$/watt' | '$/kWh' | 'percentage';
  maxAmount?: number; // Cap on total incentive
  minSystemSize?: number; // kW
  maxSystemSize?: number; // kW
  eligiblePropertyTypes: ('residential' | 'commercial' | 'nonprofit')[];
  startDate?: Date;
  endDate?: Date; // null = ongoing
  website?: string;
  notes?: string;
  isActive: boolean;
}

/**
 * Incentive lookup result
 */
export interface IncentiveLookupResult {
  state: string;
  stateCode: string;
  totalEstimatedBenefit: number; // Sum of all applicable incentives
  incentives: Incentive[];
  hasUtilityPrograms: boolean;
  hasTaxExemptions: boolean;
  notes?: string;
}

/**
 * Incentive calculation input
 */
export interface IncentiveCalculationInput {
  state: string;
  systemSizeKw: number;
  systemCost: number;
  utility?: string; // Optional utility name
  propertyType: 'residential' | 'commercial' | 'nonprofit';
}

/**
 * Incentive summary for display
 */
export interface IncentiveSummary {
  state: string;
  stateCode: string;
  utilityRebates: number; // Total from utility rebate programs
  stateTaxBenefits: number; // Total from state tax benefits
  propertyTaxExemptions: number; // Estimated annual savings
  salesTaxExemptions: number; // Estimated savings
  otherIncentives: number; // Other programs
  totalFirstYearBenefit: number; // Sum of upfront benefits
  estimatedAnnualSavings: number; // Annual property tax exemptions, etc.
  incentiveCount: number;
}

/**
 * Incentive data by state
 */
export interface StateIncentiveData {
  state: string;
  stateCode: string;
  incentives: Incentive[];
  lastUpdated: Date;
}
