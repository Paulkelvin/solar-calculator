/**
 * State & Local Incentives Service
 * Phase 5.2 Week 2: Calculate available incentives by state/utility
 * 
 * ⚠️ IMPORTANT: Federal 30% ITC is EXPIRED (ended Dec 31, 2025)
 * This service ONLY calculates state rebates, utility incentives, and net metering value.
 * NO federal tax credits are included or calculated for any installations.
 */

export interface StateIncentive {
  name: string;
  type: 'rebate' | 'tax_credit' | 'performance_payment';
  amount: number; // dollars or percentage
  description: string;
  website?: string;
}

export interface IncentiveBreakdown {
  state: string;
  stateRebates: StateIncentive[];
  utilityRebates: StateIncentive[];
  netMeteringValue: number; // annual savings from net metering
  totalAnnualIncentives: number;
  disclaimer: string;
}

/**
 * State incentive data (as of Jan 2026)
 * Note: These are examples - real data should come from DSIRE or state databases
 */
const STATE_INCENTIVES: Record<string, StateIncentive[]> = {
  CA: [
    {
      name: 'California SOMAH',
      type: 'rebate',
      amount: 0.15, // $0.15/Watt
      description: 'Solar on Multifamily Affordable Housing rebate'
    },
    {
      name: 'California Performance Payment',
      type: 'performance_payment',
      amount: 0.075, // $0.075/kWh for 5 years
      description: 'Performance-based incentive for solar production'
    }
  ],
  CO: [
    {
      name: 'Colorado Renewable Energy Rebate',
      type: 'rebate',
      amount: 0.10, // $0.10/Watt
      description: 'State renewable energy rebate program'
    }
  ],
  NY: [
    {
      name: 'NY Sun Incentive',
      type: 'rebate',
      amount: 0.25, // $0.25/Watt
      description: 'New York State residential solar incentive'
    }
  ],
  NJ: [
    {
      name: 'NJ Solar Renewable Energy Credits',
      type: 'performance_payment',
      amount: 0.08, // $0.08/kWh
      description: 'Solar Renewable Energy Credit (SREC) program'
    }
  ],
  TX: [
    {
      name: 'Texas Property Tax Exemption',
      type: 'tax_credit',
      amount: 0.1, // 10% property tax reduction
      description: 'Solar system exempt from property tax increases'
    }
  ]
};

/**
 * Utility company incentive programs
 */
const UTILITY_INCENTIVES: Record<string, StateIncentive[]> = {
  'PSEG': [
    {
      name: 'PSEG Solar Rebate',
      type: 'rebate',
      amount: 0.35, // $0.35/Watt
      description: 'Public Service Enterprise Group solar rebate'
    }
  ],
  'SCE': [
    {
      name: 'Southern California Edison Rebate',
      type: 'rebate',
      amount: 0.40, // $0.40/Watt
      description: 'SCE residential solar incentive'
    }
  ],
  'PGE': [
    {
      name: 'PG&E Home Energy Rebate',
      type: 'rebate',
      amount: 0.30, // $0.30/Watt
      description: 'Pacific Gas & Electric Company rebate'
    }
  ]
};

/**
 * Calculate incentive breakdown for a property
 * 
 * @param state - State abbreviation (e.g., 'CO', 'CA')
 * @param systemSizeKw - Solar system size in kilowatts
 * @param estimatedAnnualKwh - Estimated annual production
 * @param localElectricityRate - $/kWh (for net metering calculation)
 * @param utility - Optional utility company name
 * @returns Incentive breakdown with all available incentives
 */
export function calculateIncentives(
  state: string,
  systemSizeKw: number,
  estimatedAnnualKwh: number,
  localElectricityRate: number = 0.14, // default US average
  utility?: string
): IncentiveBreakdown {
  const stateCode = state.toUpperCase();
  
  // Get state incentives
  const stateRebates = STATE_INCENTIVES[stateCode] || [];
  
  // Calculate state rebate amounts
  const stateRebateTotal = stateRebates.reduce((sum, incentive) => {
    if (incentive.type === 'rebate') {
      if (incentive.amount < 1) {
        // Per-watt rebate
        return sum + (systemSizeKw * 1000 * incentive.amount);
      } else {
        // Fixed amount or percentage
        return sum + incentive.amount;
      }
    }
    return sum;
  }, 0);
  
  // Get utility incentives
  const utilityRebates = utility ? UTILITY_INCENTIVES[utility] || [] : [];
  
  // Calculate utility rebate amounts
  const utilityRebateTotal = utilityRebates.reduce((sum, incentive) => {
    if (incentive.type === 'rebate') {
      if (incentive.amount < 1) {
        // Per-watt rebate
        return sum + (systemSizeKw * 1000 * incentive.amount);
      } else {
        return sum + incentive.amount;
      }
    }
    return sum;
  }, 0);
  
  // Calculate net metering value (annual savings from excess production)
  // Assumes 100% net metering at retail rate
  const netMeteringValue = estimatedAnnualKwh * localElectricityRate;
  
  // Calculate performance payments (annual)
  const performancePaymentTotal = 
    (stateRebates.reduce((sum, i) => {
      return i.type === 'performance_payment' ? sum + (estimatedAnnualKwh * i.amount) : sum;
    }, 0)) +
    (utilityRebates.reduce((sum, i) => {
      return i.type === 'performance_payment' ? sum + (estimatedAnnualKwh * i.amount) : sum;
    }, 0));
  
  // Total first-year incentives (rebates only, not annual)
  const totalAnnualIncentives = stateRebateTotal + utilityRebateTotal + performancePaymentTotal;
  
  const disclaimer = 
    'Incentive estimates based on state and local programs. Consult a tax professional for personalized advice.';
  
  return {
    state: stateCode,
    stateRebates,
    utilityRebates,
    netMeteringValue,
    totalAnnualIncentives,
    disclaimer
  };
}

/**
 * Format incentive for display
 */
export function formatIncentive(incentive: StateIncentive, systemSizeKw: number): string {
  if (incentive.amount < 1) {
    const total = systemSizeKw * 1000 * incentive.amount;
    return `$${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  return `$${incentive.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
