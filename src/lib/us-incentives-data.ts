/**
 * US Solar Incentives Data
 * State-specific rebates, net metering policies, and leasing/PPA savings
 * 
 * Data sources:
 * - DSIRE (Database of State Incentives for Renewables & Efficiency)
 * - State utility commission websites
 * - Solar installer industry averages
 * 
 * Note: Federal ITC expired for new homeowner installs after 2025.
 * Focus on leasing/PPAs where installers claim tax credits and pass savings.
 */

export interface StateSolarIncentive {
  state: string;
  stateCode: string;
  
  // State rebates (homeowner-eligible)
  stateRebate?: {
    name: string;
    amountPerWatt?: number; // $/watt
    maxAmount?: number; // $ cap
    description: string;
  };
  
  // Net metering policy
  netMetering: {
    available: boolean;
    creditRate: 'retail' | 'wholesale' | 'variable'; // Retail = full credit, wholesale = ~40-60%
    description: string;
  };
  
  // Leasing/PPA average savings (% of typical utility bill)
  leasingPPA: {
    averageSavingsPercent: number; // Typical savings vs grid (10-30%)
    installerTaxCreditPassthrough: number; // % of ITC benefit passed to homeowner
    description: string;
  };
  
  // Utility rate data
  averageUtilityRate: number; // $/kWh
  rateEscalation: number; // % annual increase
  
  // Additional notes
  notes?: string;
}

export const US_STATE_INCENTIVES: StateSolarIncentive[] = [
  {
    state: "California",
    stateCode: "CA",
    stateRebate: {
      name: "SGIP (Self-Generation Incentive Program)",
      amountPerWatt: 0.15,
      maxAmount: 3000,
      description: "Battery storage incentive for solar+storage systems. Varies by utility territory."
    },
    netMetering: {
      available: true,
      creditRate: "retail",
      description: "NEM 3.0: Export credits at ~75% of retail rate for most utilities. Legacy NEM 2.0 grandfathered at full retail."
    },
    leasingPPA: {
      averageSavingsPercent: 20,
      installerTaxCreditPassthrough: 25,
      description: "Leases and PPAs common. Installers claim ITC and pass ~25% benefit via lower rates. Typical 20% bill savings."
    },
    averageUtilityRate: 0.28,
    rateEscalation: 4.5,
    notes: "High utility rates make solar very attractive. NEM 3.0 reduces export credits but economics still strong."
  },
  {
    state: "Texas",
    stateCode: "TX",
    netMetering: {
      available: false,
      creditRate: "wholesale",
      description: "No statewide net metering. Some utilities offer limited buyback at wholesale rates (~$0.03-0.05/kWh)."
    },
    leasingPPA: {
      averageSavingsPercent: 15,
      installerTaxCreditPassthrough: 20,
      description: "PPAs popular due to lack of net metering. Installers use ITC to lower PPA rates. ~15% typical savings."
    },
    averageUtilityRate: 0.12,
    rateEscalation: 3.0,
    notes: "Deregulated market. Battery storage recommended to maximize self-consumption without net metering."
  },
  {
    state: "Florida",
    stateCode: "FL",
    stateRebate: {
      name: "Property Tax Exemption",
      description: "Solar systems exempt from property tax assessment increase. Saves ~$500-1500/year depending on system size."
    },
    netMetering: {
      available: true,
      creditRate: "retail",
      description: "Full retail net metering with monthly rollover. Excess credits expire annually."
    },
    leasingPPA: {
      averageSavingsPercent: 18,
      installerTaxCreditPassthrough: 22,
      description: "Strong leasing market. Property tax exemption + installer ITC creates 18% average savings."
    },
    averageUtilityRate: 0.13,
    rateEscalation: 3.2,
  },
  {
    state: "New York",
    stateCode: "NY",
    stateRebate: {
      name: "NY-Sun Incentive",
      amountPerWatt: 0.40,
      maxAmount: 5000,
      description: "Statewide solar rebate. Amount varies by utility zone and system size. Gradually declining."
    },
    netMetering: {
      available: true,
      creditRate: "retail",
      description: "Full retail net metering with VDER (Value of Distributed Energy Resources) credits in some zones."
    },
    leasingPPA: {
      averageSavingsPercent: 22,
      installerTaxCreditPassthrough: 28,
      description: "Robust state incentive + installer ITC creates strong economics. 22% typical savings."
    },
    averageUtilityRate: 0.20,
    rateEscalation: 3.8,
    notes: "Aggressive state solar targets. Strong policy support for residential solar."
  },
  {
    state: "Arizona",
    stateCode: "AZ",
    stateRebate: {
      name: "APS Solar Partner Program",
      amountPerWatt: 0.10,
      maxAmount: 1000,
      description: "Utility-specific incentives. APS and SRP offer limited rebates. Varies by utility."
    },
    netMetering: {
      available: true,
      creditRate: "variable",
      description: "Export rates vary by utility. APS ~$0.10/kWh export credit. Lower than retail but still valuable."
    },
    leasingPPA: {
      averageSavingsPercent: 25,
      installerTaxCreditPassthrough: 30,
      description: "Excellent solar resource. High savings despite moderate incentives. Leasing popular."
    },
    averageUtilityRate: 0.13,
    rateEscalation: 3.5,
    notes: "Abundant sunshine compensates for moderate incentives. Strong solar economics."
  },
  {
    state: "Massachusetts",
    stateCode: "MA",
    stateRebate: {
      name: "SMART Program",
      amountPerWatt: 0.30,
      maxAmount: 4000,
      description: "Solar Massachusetts Renewable Target. Capacity-based incentive declining over time."
    },
    netMetering: {
      available: true,
      creditRate: "retail",
      description: "Full retail net metering with monthly rollover. Market Net Metering Credit for excess."
    },
    leasingPPA: {
      averageSavingsPercent: 24,
      installerTaxCreditPassthrough: 28,
      description: "Strong state incentives + high utility rates. PPAs offer 24% average savings."
    },
    averageUtilityRate: 0.24,
    rateEscalation: 4.0,
    notes: "Aggressive renewable energy goals. One of the best states for solar economics."
  },
  {
    state: "New Jersey",
    stateCode: "NJ",
    stateRebate: {
      name: "SREC-II Program",
      description: "Solar Renewable Energy Certificates. Earn tradable credits worth ~$80-90/MWh. Passive income stream."
    },
    netMetering: {
      available: true,
      creditRate: "retail",
      description: "Full retail net metering with annual true-up. Strong net metering policy."
    },
    leasingPPA: {
      averageSavingsPercent: 23,
      installerTaxCreditPassthrough: 27,
      description: "SREC income + leasing savings create strong value. 23% average bill reduction."
    },
    averageUtilityRate: 0.17,
    rateEscalation: 3.6,
    notes: "SRECs provide ongoing revenue beyond electricity savings."
  },
  {
    state: "Colorado",
    stateCode: "CO",
    stateRebate: {
      name: "Xcel Energy Solar*Rewards",
      amountPerWatt: 0.08,
      maxAmount: 800,
      description: "Utility rebate for Xcel customers. Other utilities have similar programs."
    },
    netMetering: {
      available: true,
      creditRate: "retail",
      description: "Full retail net metering with monthly rollover."
    },
    leasingPPA: {
      averageSavingsPercent: 18,
      installerTaxCreditPassthrough: 23,
      description: "Good solar resource. Leasing popular due to no upfront cost. 18% typical savings."
    },
    averageUtilityRate: 0.13,
    rateEscalation: 3.3,
  },
  {
    state: "North Carolina",
    stateCode: "NC",
    netMetering: {
      available: true,
      creditRate: "variable",
      description: "Net metering available but rates vary. Some utilities offer avoided cost rates."
    },
    leasingPPA: {
      averageSavingsPercent: 16,
      installerTaxCreditPassthrough: 20,
      description: "Growing solar market. PPAs gaining traction. 16% average savings."
    },
    averageUtilityRate: 0.11,
    rateEscalation: 2.8,
    notes: "Duke Energy territory. Third-party solar sales restrictions lifted in 2017, boosting market."
  },
  {
    state: "Nevada",
    stateCode: "NV",
    netMetering: {
      available: true,
      creditRate: "retail",
      description: "Restored full retail net metering in 2017 after brief suspension."
    },
    leasingPPA: {
      averageSavingsPercent: 20,
      installerTaxCreditPassthrough: 25,
      description: "Excellent solar resource. Leasing popular. 20% average savings."
    },
    averageUtilityRate: 0.12,
    rateEscalation: 3.1,
    notes: "Strong solar conditions. Net metering restoration revitalized market."
  },
];

/**
 * Get incentives for a specific state
 */
export function getStateIncentives(stateCode: string): StateSolarIncentive | null {
  return US_STATE_INCENTIVES.find(s => s.stateCode === stateCode) || null;
}

/**
 * Calculate total incentives for a system
 */
export function calculateSystemIncentives(
  stateCode: string,
  systemSizeKw: number,
  annualProductionKwh: number
): {
  stateRebate: number;
  firstYearNetMeteringValue: number;
  leasingPPASavingsPercent: number;
  totalFirstYear: number;
  notes: string[];
} {
  const incentives = getStateIncentives(stateCode);
  
  if (!incentives) {
    return {
      stateRebate: 0,
      firstYearNetMeteringValue: 0,
      leasingPPASavingsPercent: 15, // Default estimate
      totalFirstYear: 0,
      notes: ["State incentive data not available. Using national averages."]
    };
  }
  
  // Calculate state rebate
  let stateRebate = 0;
  if (incentives.stateRebate) {
    if (incentives.stateRebate.amountPerWatt) {
      stateRebate = Math.min(
        incentives.stateRebate.amountPerWatt * systemSizeKw * 1000,
        incentives.stateRebate.maxAmount || Infinity
      );
    }
  }
  
  // Calculate net metering value (first year export value estimate)
  let firstYearNetMeteringValue = 0;
  if (incentives.netMetering.available) {
    const exportRate = incentives.netMetering.creditRate === 'retail' 
      ? incentives.averageUtilityRate 
      : incentives.netMetering.creditRate === 'wholesale'
      ? incentives.averageUtilityRate * 0.4
      : incentives.averageUtilityRate * 0.75; // variable
      
    // Assume ~30% of production exported
    firstYearNetMeteringValue = annualProductionKwh * 0.3 * exportRate;
  }
  
  const notes: string[] = [];
  
  if (incentives.stateRebate) {
    notes.push(`${incentives.stateRebate.name}: ${incentives.stateRebate.description}`);
  }
  
  notes.push(`Net Metering: ${incentives.netMetering.description}`);
  notes.push(`Leasing/PPA: ${incentives.leasingPPA.description}`);
  
  if (incentives.notes) {
    notes.push(incentives.notes);
  }
  
  return {
    stateRebate,
    firstYearNetMeteringValue,
    leasingPPASavingsPercent: incentives.leasingPPA.averageSavingsPercent,
    totalFirstYear: stateRebate + firstYearNetMeteringValue,
    notes
  };
}
