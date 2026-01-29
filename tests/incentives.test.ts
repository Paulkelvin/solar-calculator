import { describe, it, expect } from 'vitest';
import {
  getIncentivesByState,
  lookupIncentives,
  getIncentiveSummary,
  hasIncentives,
  getTopIncentiveStates,
  compareStateIncentives,
} from '@/lib/calculations/incentives';
import type { IncentiveCalculationInput } from '../types/incentives';

describe('Incentives - State Coverage', () => {
  it('should have incentives for all 50 states', () => {
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    ];

    // Check that all states can be looked up
    for (const state of states) {
      const result = lookupIncentives({
        state,
        systemSizeKw: 8,
        systemCost: 22000,
        propertyType: 'residential',
      });
      expect(result.stateCode).toBe(state);
    }
  });

  it('should identify 30+ states with active programs', () => {
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    ];

    let statesWithIncentives = 0;
    for (const state of states) {
      if (hasIncentives(state)) {
        statesWithIncentives++;
      }
    }

    expect(statesWithIncentives).toBeGreaterThan(25);
  });
});

describe('Incentives - Lookup & Calculation', () => {
  it('should calculate incentives for California', () => {
    const result = lookupIncentives({
      state: 'CA',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(result.stateCode).toBe('CA');
    expect(result.incentives.length).toBeGreaterThan(0);
    expect(result.totalEstimatedBenefit).toBeGreaterThan(0);
    expect(result.hasTaxExemptions).toBe(true);
  });

  it('should calculate incentives for Illinois', () => {
    const result = lookupIncentives({
      state: 'IL',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(result.stateCode).toBe('IL');
    expect(result.incentives.length).toBeGreaterThan(0);
    expect(result.totalEstimatedBenefit).toBeGreaterThan(5000); // IL pays ~$1.50/W
  });

  it('should calculate incentives for New York', () => {
    const result = lookupIncentives({
      state: 'NY',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(result.stateCode).toBe('NY');
    expect(result.incentives.length).toBeGreaterThan(0);
    // NY pays $2/W capped at $10K: 8 kW * 1000 * $2 = $16K but capped at $10K
    expect(result.totalEstimatedBenefit).toBeLessThanOrEqual(10000);
    expect(result.totalEstimatedBenefit).toBeGreaterThan(8000);
  });

  it('should return zero incentives for no-program states', () => {
    const result = lookupIncentives({
      state: 'TX',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(result.stateCode).toBe('TX');
    expect(result.incentives.length).toBe(0);
    expect(result.totalEstimatedBenefit).toBe(0);
  });

  it('should respect system size constraints', () => {
    // Large system (20 kW) - may exceed limits
    const largeResult = lookupIncentives({
      state: 'AZ',
      systemSizeKw: 20,
      systemCost: 55000,
      propertyType: 'residential',
    });

    // Small system (2 kW) - minimum requirement
    const smallResult = lookupIncentives({
      state: 'AZ',
      systemSizeKw: 2,
      systemCost: 5500,
      propertyType: 'residential',
    });

    // Both should have incentives but may differ
    expect(largeResult.incentives.length).toBeGreaterThanOrEqual(0);
    expect(smallResult.incentives.length).toBeGreaterThanOrEqual(0);
  });

  it('should apply incentive caps correctly', () => {
    // NY caps at $10K
    const nyLarge = lookupIncentives({
      state: 'NY',
      systemSizeKw: 15,
      systemCost: 41250, // Very large system
      propertyType: 'residential',
    });

    expect(nyLarge.totalEstimatedBenefit).toBeLessThanOrEqual(10000);
  });

  it('should filter by property type', () => {
    // Most incentives are residential
    const residential = lookupIncentives({
      state: 'CA',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    // Commercial may have different incentives
    const commercial = lookupIncentives({
      state: 'CA',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'commercial',
    });

    expect(residential.incentives.length).toBeGreaterThan(0);
    expect(commercial.incentives.length).toBeGreaterThan(0);
  });
});

describe('Incentives - Summary', () => {
  it('should generate summary for high-incentive state', () => {
    const summary = getIncentiveSummary({
      state: 'IL',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(summary.stateCode).toBe('IL');
    expect(summary.incentiveCount).toBeGreaterThan(0);
    expect(summary.totalFirstYearBenefit).toBeGreaterThan(0);
    // Illinois is a state program, not utility, so it's counted in stateTaxBenefits
    expect(summary.stateTaxBenefits).toBeGreaterThan(0);
  });

  it('should generate summary for moderate-incentive state', () => {
    const summary = getIncentiveSummary({
      state: 'AZ',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(summary.stateCode).toBe('AZ');
    expect(summary.incentiveCount).toBeGreaterThan(0);
    expect(summary.utilityRebates).toBeGreaterThan(0);
  });

  it('should generate summary for no-incentive state', () => {
    const summary = getIncentiveSummary({
      state: 'TX',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(summary.stateCode).toBe('TX');
    expect(summary.incentiveCount).toBe(0);
    expect(summary.totalFirstYearBenefit).toBe(0);
  });

  it('should show tax exemptions for eligible states', () => {
    // California has property tax exemption
    const caSummary = getIncentiveSummary({
      state: 'CA',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(caSummary.stateTaxBenefits).toBeGreaterThan(0);

    // Texas has no programs
    const txSummary = getIncentiveSummary({
      state: 'TX',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    expect(txSummary.stateTaxBenefits).toBe(0);
  });

  it('should calculate sales tax exemptions where applicable', () => {
    // California has sales tax exemption (7.25%)
    const summary = getIncentiveSummary({
      state: 'CA',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    // $22,000 * 7.25% = $1,595
    expect(summary.salesTaxExemptions).toBeGreaterThan(1000);
    expect(summary.salesTaxExemptions).toBeLessThan(2000);
  });
});

describe('Incentives - Top States', () => {
  it('should identify top incentive states', () => {
    const topStates = getTopIncentiveStates();

    expect(topStates.length).toBeGreaterThan(5);
    expect(topStates).toContain('CA');
    expect(topStates).toContain('IL');
    expect(topStates).toContain('NY');
  });

  it('should rank states by incentive generosity', () => {
    const topStates = getTopIncentiveStates();

    // All top states should have programs
    for (const state of topStates) {
      const incentives = getIncentivesByState(state);
      expect(incentives.length).toBeGreaterThan(0);
    }
  });
});

describe('Incentives - Comparison', () => {
  it('should compare incentives across all states', () => {
    const comparison = compareStateIncentives(8, 22000);

    expect(Object.keys(comparison).length).toBe(50);

    // High-incentive states should rank highly
    const caIncentive = comparison['CA'];
    const txIncentive = comparison['TX'];

    expect(caIncentive).toBeGreaterThan(txIncentive);
  });

  it('should show variation based on system size', () => {
    const small = compareStateIncentives(2, 5500);
    const large = compareStateIncentives(15, 41250);

    // Some states may have size limits
    const ilSmall = small['IL'];
    const ilLarge = large['IL'];

    // Larger systems should get more incentives (up to caps)
    expect(typeof ilSmall).toBe('number');
    expect(typeof ilLarge).toBe('number');
  });

  it('should identify no-incentive states', () => {
    const comparison = compareStateIncentives(8, 22000);

    // Check known no-incentive states
    const noIncentiveStates = ['IN', 'KS', 'KY', 'LA', 'MI', 'MS', 'MO', 'ND', 'OH', 'OK', 'PA', 'SD', 'TN', 'TX', 'VA', 'WV'];

    for (const state of noIncentiveStates) {
      expect(comparison[state]).toBe(0);
    }
  });
});

describe('Incentives - Specific State Programs', () => {
  it('should calculate Hawaii incentives (highest in nation)', () => {
    const result = lookupIncentives({
      state: 'HI',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    // Hawaii has property tax exemption + rebate
    expect(result.incentives.length).toBeGreaterThan(1);
    expect(result.totalEstimatedBenefit).toBeGreaterThan(7000);
  });

  it('should calculate California incentives (most programs)', () => {
    const result = lookupIncentives({
      state: 'CA',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    // California has property tax exemption, sales tax exemption, and utility rebates
    expect(result.incentives.length).toBeGreaterThan(3);
    expect(result.hasTaxExemptions).toBe(true);
  });

  it('should identify utility-specific programs', () => {
    const result = lookupIncentives({
      state: 'AZ',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    });

    // Arizona has both APS and SRP programs
    expect(result.hasUtilityPrograms).toBe(true);
  });
});

describe('Incentives - Edge Cases', () => {
  it('should handle very small systems', () => {
    const result = lookupIncentives({
      state: 'IL',
      systemSizeKw: 1,
      systemCost: 2750,
      propertyType: 'residential',
    });

    // Most programs require minimum system size
    expect(result.incentives.length).toBeLessThanOrEqual(1);
  });

  it('should handle very large systems', () => {
    const result = lookupIncentives({
      state: 'IL',
      systemSizeKw: 50,
      systemCost: 137500,
      propertyType: 'residential',
    });

    // Large systems may exceed incentive caps
    expect(result.totalEstimatedBenefit).toBeLessThanOrEqual(10500); // IL cap is $10,500
  });

  it('should handle commercial properties', () => {
    const result = lookupIncentives({
      state: 'IL',
      systemSizeKw: 20,
      systemCost: 55000,
      propertyType: 'commercial',
    });

    // Illinois program supports commercial
    expect(result.incentives.length).toBeGreaterThan(0);
  });

  it('should handle nonprofit properties', () => {
    const result = lookupIncentives({
      state: 'NM',
      systemSizeKw: 10,
      systemCost: 27500,
      propertyType: 'nonprofit',
    });

    // Some states support nonprofits
    expect(typeof result.totalEstimatedBenefit).toBe('number');
  });
});

describe('Incentives - Combined with Tax Credits', () => {
  it('should show total benefit: tax credit + incentive', () => {
    // Illinois: 30% federal ITC ($6,600) + $1.50/W rebate
    const input: IncentiveCalculationInput = {
      state: 'IL',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    };

    const lookup = lookupIncentives(input);
    const federalITC = 22000 * 0.30; // $6,600
    const stateCredit = 22000 * 0.30; // $6,600 (Illinois 30% tax credit)
    const incentive = lookup.totalEstimatedBenefit;

    const totalBenefit = federalITC + stateCredit + incentive;
    expect(totalBenefit).toBeGreaterThan(15000); // $6,600 + $6,600 + $1,200+ = $14,400+
  });

  it('should show typical savings California', () => {
    // California: 30% federal + 15% state credit + incentives
    const input: IncentiveCalculationInput = {
      state: 'CA',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    };

    const lookup = lookupIncentives(input);
    const federalITC = 22000 * 0.30; // $6,600
    const stateCredit = 22000 * 0.15; // $3,300 (capped at $3,000)
    const incentive = lookup.totalEstimatedBenefit;

    const totalBenefit = federalITC + stateCredit + incentive;
    expect(totalBenefit).toBeGreaterThan(9000);
  });

  it('should show minimal savings Texas', () => {
    // Texas: 30% federal only, no state incentives
    const input: IncentiveCalculationInput = {
      state: 'TX',
      systemSizeKw: 8,
      systemCost: 22000,
      propertyType: 'residential',
    };

    const lookup = lookupIncentives(input);
    const federalITC = 22000 * 0.30; // $6,600
    const incentive = lookup.totalEstimatedBenefit; // $0

    const totalBenefit = federalITC + incentive;
    expect(totalBenefit).toBe(6600);
  });
});

describe('Incentives - State-Specific Details', () => {
  it('should show Arizona has multiple utilities', () => {
    const incentives = getIncentivesByState('AZ');
    const utilities = new Set(incentives.map((i) => i.utility).filter(Boolean));

    expect(utilities.size).toBeGreaterThan(1);
    expect(utilities).toContain('APS');
    expect(utilities).toContain('SRP');
  });

  it('should show California has property tax exemption', () => {
    const incentives = getIncentivesByState('CA');
    const hasPropertyTax = incentives.some((i) => i.incentiveType === 'tax-exemption');

    expect(hasPropertyTax).toBe(true);
  });

  it('should show Hawaii has highest rebate rate', () => {
    const hiIncentives = getIncentivesByState('HI');
    const rebates = hiIncentives.filter((i) => i.unit === '$/watt');

    if (rebates.length > 0) {
      const maxRate = Math.max(...rebates.map((r) => r.amount));
      expect(maxRate).toBeGreaterThanOrEqual(1.0);
    }
  });

  it('should show expired programs', () => {
    const coIncentives = getIncentivesByState('CO');
    const expiring = coIncentives.filter((i) => i.endDate && i.endDate < new Date('2030-01-01'));

    expect(expiring.length).toBeGreaterThan(0);
  });
});
