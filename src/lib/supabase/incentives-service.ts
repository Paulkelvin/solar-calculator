/**
 * Supabase Incentives Service
 * Phase 3: Dynamic incentives from 50-state database
 * 
 * Fetches state-specific solar incentives including:
 * - State rebates
 * - Federal programs (commercial ITC, USDA REAP)
 * - Net metering policies
 * - Leasing/PPA programs
 * - Utility rate data
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Incentive {
  id: string;
  state: string;
  name: string;
  type: 'rebate' | 'tax_credit' | 'net_metering' | 'lease' | 'ppa' | 'other';
  amount?: string;
  description: string;
  eligibility?: string;
  expirationDate?: string;
  websiteUrl?: string;
  isActive: boolean;
}

export interface IncentiveSummary {
  totalRebates: number; // Total $ from state/federal rebates
  netMeteringValue: number; // Annual $ value of net metering
  leasingSavings: number; // Estimated annual savings via lease/PPA
  federalPrograms: Incentive[];
  statePrograms: Incentive[];
  utilityPrograms: Incentive[];
}

/**
 * Fetch active incentives for a specific state
 * Includes federal programs that apply to all states
 */
export async function fetchIncentivesByState(stateCode: string): Promise<Incentive[]> {
  const { data, error } = await supabase
    .from('active_incentives')
    .select('*')
    .or(`state.eq.${stateCode.toUpperCase()},state.eq.US`)
    .order('type', { ascending: true });
  
  if (error) {
    console.error('Error fetching incentives:', error);
    return [];
  }
  
  return (data || []).map(row => ({
    id: row.id,
    state: row.state,
    name: row.name,
    type: row.type,
    amount: row.amount,
    description: row.description,
    eligibility: row.eligibility,
    expirationDate: row.expiration_date,
    websiteUrl: row.website_url,
    isActive: row.is_active,
  }));
}

/**
 * Calculate total incentive value for a system
 * Phase 3: Emphasizes post-ITC alternatives (leasing/PPA)
 */
export async function calculateIncentiveValue(
  stateCode: string,
  systemSizeKw: number,
  systemCostUsd: number,
  annualProductionKwh: number,
  utilityRatePerKwh: number = 0.14
): Promise<IncentiveSummary> {
  const incentives = await fetchIncentivesByState(stateCode);
  
  let totalRebates = 0;
  let netMeteringValue = 0;
  let leasingSavings = 0;
  
  const federalPrograms: Incentive[] = [];
  const statePrograms: Incentive[] = [];
  const utilityPrograms: Incentive[] = [];
  
  incentives.forEach(inc => {
    // Categorize by state
    if (inc.state === 'US') {
      federalPrograms.push(inc);
    } else {
      statePrograms.push(inc);
    }
    
    // Calculate rebate amounts
    if (inc.type === 'rebate' && inc.amount) {
      const amount = parseIncentiveAmount(inc.amount, systemSizeKw, systemCostUsd);
      totalRebates += amount;
    }
    
    // Estimate net metering value (annual production * retail rate * 0.8)
    if (inc.type === 'net_metering') {
      netMeteringValue = annualProductionKwh * utilityRatePerKwh * 0.8; // 80% of production exported
      utilityPrograms.push(inc);
    }
    
    // Estimate leasing savings (20% of annual utility bill on average)
    if (inc.type === 'lease' || inc.type === 'ppa') {
      leasingSavings = annualProductionKwh * utilityRatePerKwh * 0.20;
    }
  });
  
  return {
    totalRebates,
    netMeteringValue,
    leasingSavings,
    federalPrograms,
    statePrograms,
    utilityPrograms,
  };
}

/**
 * Parse incentive amount strings like "$1,000", "$0.50/W", "25%"
 */
function parseIncentiveAmount(
  amountStr: string,
  systemSizeKw: number,
  systemCostUsd: number
): number {
  // Remove $ and commas
  const cleaned = amountStr.replace(/[$,]/g, '').trim();
  
  // Per-watt incentive: "$0.50/W"
  if (cleaned.includes('/W') || cleaned.includes('per watt')) {
    const perWatt = parseFloat(cleaned.replace(/\/W|per watt/gi, ''));
    return perWatt * systemSizeKw * 1000; // Convert kW to W
  }
  
  // Percentage: "25%"
  if (cleaned.includes('%')) {
    const percent = parseFloat(cleaned.replace('%', '')) / 100;
    return systemCostUsd * percent;
  }
  
  // Fixed amount: "$1000"
  if (!isNaN(parseFloat(cleaned))) {
    return parseFloat(cleaned);
  }
  
  return 0;
}

/**
 * Get recommended financing option based on incentives
 * Post-ITC era: Emphasize leasing/PPA if state rebates are low
 */
export async function getRecommendedFinancing(stateCode: string): Promise<{
  recommended: 'cash' | 'loan' | 'lease' | 'ppa';
  reasoning: string;
}> {
  const incentives = await fetchIncentivesByState(stateCode);
  
  const hasStrongRebates = incentives.some(
    inc => inc.type === 'rebate' && inc.amount && parseFloat(inc.amount.replace(/[^0-9.]/g, '')) > 1000
  );
  
  const hasNetMetering = incentives.some(inc => inc.type === 'net_metering');
  const hasLeasing = incentives.some(inc => inc.type === 'lease' || inc.type === 'ppa');
  
  // Post-ITC decision tree
  if (hasStrongRebates && hasNetMetering) {
    return {
      recommended: 'loan',
      reasoning: 'State rebates + net metering make ownership attractive. Loan maximizes long-term savings.',
    };
  }
  
  if (hasLeasing) {
    return {
      recommended: 'lease',
      reasoning: 'With expired federal ITC, solar leasing offers $0 down + immediate savings. Installer claims tax benefits.',
    };
  }
  
  if (hasNetMetering) {
    return {
      recommended: 'loan',
      reasoning: 'Net metering available. Ownership recommended to maximize export credits.',
    };
  }
  
  return {
    recommended: 'ppa',
    reasoning: 'Power purchase agreement offers guaranteed savings with no upfront cost. Best for limited incentives.',
  };
}

/**
 * Cache incentives in localStorage for performance
 * Refresh daily
 */
export async function getCachedIncentives(stateCode: string): Promise<Incentive[]> {
  const cacheKey = `incentives_${stateCode}`;
  const cacheTimestampKey = `${cacheKey}_timestamp`;
  
  const cached = localStorage.getItem(cacheKey);
  const timestamp = localStorage.getItem(cacheTimestampKey);
  
  // Check if cache is valid (less than 24 hours old)
  if (cached && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    if (age < 24 * 60 * 60 * 1000) {
      return JSON.parse(cached);
    }
  }
  
  // Fetch fresh data
  const incentives = await fetchIncentivesByState(stateCode);
  
  // Update cache
  localStorage.setItem(cacheKey, JSON.stringify(incentives));
  localStorage.setItem(cacheTimestampKey, Date.now().toString());
  
  return incentives;
}
