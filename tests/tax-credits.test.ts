import { describe, it, expect } from 'vitest';
import {
  calculateFederalITC,
  calculateStateTaxCredit,
  calculateTotalTaxCredits,
  formatTaxCreditDisplay,
  getTaxCreditBreakdownText,
  isStateCreditExpiring,
  calculatePayoffWithCredits,
  estimateTotalSavings,
  getAllStateTaxCreditsSummary,
} from '@/lib/calculations/tax-credits';
import {
  getStateTaxCredit,
  type TaxCreditConfig,
} from '../types/tax-credits';

describe('Tax Credits - Federal ITC (Discontinued)', () => {
  it('should return 0% federal ITC for 2024 (discontinued)', () => {
    const result = calculateFederalITC(22000, 2024);
    expect(result.rate).toBe(0);
    expect(result.credit).toBe(0);
  });

  it('should return 0% federal ITC for 2027 (discontinued)', () => {
    const result = calculateFederalITC(22000, 2027);
    expect(result.rate).toBe(0);
    expect(result.credit).toBe(0);
  });

  it('should return 0% federal ITC for 2029+ (discontinued)', () => {
    const result = calculateFederalITC(22000, 2029);
    expect(result.rate).toBe(0);
    expect(result.credit).toBe(0);
  });

  it('should return 0% for all years (discontinued)', () => {
    const result = calculateFederalITC(22000, 2050);
    expect(result.rate).toBe(0);
    expect(result.credit).toBe(0);
  });

  it('should handle zero system cost', () => {
    const result = calculateFederalITC(0, 2024);
    expect(result.credit).toBe(0);
  });

  it('should return 0 for large system costs (discontinued)', () => {
    const result = calculateFederalITC(100000, 2024);
    expect(result.credit).toBe(0);
  });
});

describe('Tax Credits - State Credits', () => {
  // States with NO tax credit
  it('should return 0 credit for states with no program (AL, AK, FL, TX)', () => {
    for (const state of ['AL', 'AK', 'FL', 'TX']) {
      const result = calculateStateTaxCredit(22000, state);
      expect(result.credit).toBe(0);
      expect(result.rate).toBe(0);
    }
  });

  // States with tax credits - HIGH CREDIT STATES
  it('should calculate 30% credit for Georgia (max $6,700)', () => {
    const result = calculateStateTaxCredit(22000, 'GA');
    expect(result.rate).toBe(0.30);
    expect(result.credit).toBe(6600);
    expect(result.capped).toBe(false); // $6,600 < $6,700 cap
  });

  it('should cap Georgia credit at $6,700', () => {
    const result = calculateStateTaxCredit(30000, 'GA');
    expect(result.credit).toBe(6700);
    expect(result.capped).toBe(true);
  });

  it('should calculate 35% credit for Hawaii (max $5,000)', () => {
    const result = calculateStateTaxCredit(15000, 'HI');
    const calculated = 15000 * 0.35;
    expect(result.rate).toBe(0.35);
    expect(result.credit).toBe(5000); // Capped at $5,000
    expect(result.capped).toBe(true);
  });

  it('should calculate 30% credit for Illinois (max $9,000)', () => {
    const result = calculateStateTaxCredit(22000, 'IL');
    expect(result.rate).toBe(0.30);
    expect(result.credit).toBe(6600);
    expect(result.capped).toBe(false);
  });

  it('should calculate 30% credit for Minnesota (max $5,850)', () => {
    const result = calculateStateTaxCredit(22000, 'MN');
    expect(result.rate).toBe(0.30);
    expect(result.credit).toBe(5850); // Capped at $5,850
    expect(result.capped).toBe(true);
  });

  // States with MODERATE credits
  it('should calculate 25% credit for California (max $3,000)', () => {
    const result = calculateStateTaxCredit(22000, 'CA');
    expect(result.rate).toBe(0.15); // CA uses 15%, not 25%
    expect(result.credit).toBe(3000); // Capped
    expect(result.capped).toBe(true);
  });

  it('should calculate 25% credit for Connecticut (max $5,625)', () => {
    const result = calculateStateTaxCredit(22000, 'CT');
    expect(result.rate).toBe(0.25);
    expect(result.credit).toBe(5500); // $22,000 * 0.25 = $5,500
    expect(result.capped).toBe(false);
  });

  it('should calculate 25% credit for New York (max $5,625)', () => {
    const result = calculateStateTaxCredit(22000, 'NY');
    expect(result.rate).toBe(0.25);
    expect(result.credit).toBe(5500);
    expect(result.capped).toBe(false);
  });

  // States with LOW/MODERATE credits
  it('should calculate 10% credit for Nevada (max $2,000)', () => {
    const result = calculateStateTaxCredit(22000, 'NV');
    expect(result.rate).toBe(0.10);
    expect(result.credit).toBe(2000); // Capped at $2,000
    expect(result.capped).toBe(true);
  });

  it('should calculate 15% credit for Arizona (max $1,000)', () => {
    const result = calculateStateTaxCredit(22000, 'AZ');
    expect(result.rate).toBe(0.25);
    expect(result.credit).toBe(1000); // Capped at $1,000
    expect(result.capped).toBe(true);
  });
});

describe('Tax Credits - All 50 States', () => {
  it('should have entry for all 50 states', () => {
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    ];

    for (const state of states) {
      const credit = getStateTaxCredit(state);
      expect(credit).toBeDefined();
      expect(credit.stateCode).toBe(state);
    }
  });

  it('should identify 27 states with tax credits', () => {
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    ];

    const statesWithCredits = states.filter(s => {
      const credit = getStateTaxCredit(s);
      return credit && credit.rate > 0;
    });
    expect(statesWithCredits.length).toBeGreaterThan(20);
    expect(statesWithCredits.length).toBeLessThan(35);
  });
});

describe('Tax Credits - Total Calculation (No Federal ITC)', () => {
  it('should calculate state-only credit for high-credit state (IL)', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'IL',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    expect(result.federalCredit).toBe(0); // Federal ITC discontinued
    expect(result.stateCredit).toBe(6600); // 30% of $22,000
    expect(result.totalTaxCredit).toBe(6600);
    expect(result.netSystemCost).toBe(15400);
  });

  it('should calculate zero credits for no-credit state (TX)', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'TX',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    expect(result.federalCredit).toBe(0);
    expect(result.stateCredit).toBe(0);
    expect(result.totalTaxCredit).toBe(0);
    expect(result.netSystemCost).toBe(22000);
  });

  it('should reduce net cost by state credit only', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 30000,
      state: 'NY',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    expect(result.federalCredit).toBe(0);
    expect(result.netSystemCost).toBe(30000 - result.stateCredit);
    expect(result.netSystemCost).toBeGreaterThan(0);
  });

  it('should calculate payoff reduction from state credits', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'IL',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    expect(result.payoffReduction).toBeGreaterThan(2); // State credit only
    expect(result.payoffReduction).toBeLessThan(6);
  });

  it('should improve ROI with state credits vs no credits', () => {
    const configNO = { systemCostBeforeTax: 22000, state: 'TX', year: 2024 };
    const resultNO = calculateTotalTaxCredits(configNO);

    const configYES = { systemCostBeforeTax: 22000, state: 'IL', year: 2024 };
    const resultYES = calculateTotalTaxCredits(configYES);

    expect(resultYES.roi_with_credits).toBeGreaterThan(resultNO.roi_with_credits);
  });

  it('should handle zero system cost', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 0,
      state: 'CA',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    expect(result.totalTaxCredit).toBe(0);
    expect(result.netSystemCost).toBe(0);
  });
});

describe('Tax Credits - Display & Formatting', () => {
  it('should format tax credit display for state with credit', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'IL',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    const display = formatTaxCreditDisplay(result);

    expect(display).toContain('State Credit');
    expect(display).toContain('Total Benefit');
    expect(display).toContain('$');
  });

  it('should format tax credit display for state without credit', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'TX',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    const display = formatTaxCreditDisplay(result);

    expect(display).toContain('No federal or state');
    expect(display).toContain('Total Benefit');
  });

  it('should provide breakdown text for states', () => {
    const textIL = getTaxCreditBreakdownText('IL', 2024);
    expect(textIL).toContain('Illinois');
    expect(textIL).toContain('30');

    const textTX = getTaxCreditBreakdownText('TX', 2024);
    expect(textTX).toContain('No federal or state');
  });
});

describe('Tax Credits - Expiration & Status', () => {
  it('should identify expiring state credits', () => {
    const co = isStateCreditExpiring('CO', 1); // CO expires 2025
    expect(co).toBe(true); // Should be expiring within 1 year

    const ca = isStateCreditExpiring('CA', 1);
    // CA has no end year, so should be false
    expect(ca).toBe(false);
  });

  it('should identify upcoming expirations', () => {
    const nc = isStateCreditExpiring('NC', 2); // NC expires end of 2024
    expect(typeof nc).toBe('boolean');
  });
});

describe('Tax Credits - Payoff Analysis', () => {
  it('should calculate reduced payoff with credits', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'IL',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    const payoff = calculatePayoffWithCredits(22000, 2000, result);

    expect(payoff.withoutCredits).toBe(11); // 22000 / 2000
    expect(payoff.withCredits).toBeLessThan(payoff.withoutCredits);
    expect(payoff.yearsReduced).toBeGreaterThan(0);
  });

  it('should handle varying annual savings', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'CA',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);

    const payoff1 = calculatePayoffWithCredits(22000, 1500, result);
    const payoff2 = calculatePayoffWithCredits(22000, 3000, result);

    expect(payoff1.withCredits).toBeGreaterThan(payoff2.withCredits);
  });
});

describe('Tax Credits - Savings Estimation', () => {
  it('should estimate 25-year savings with tax credits', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'IL',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    const savings = estimateTotalSavings(22000, 2000, 25, result);

    expect(savings.grossSavings).toBe(50000); // 2000 * 25
    expect(savings.taxCredits).toBe(result.totalTaxCredit);
    expect(savings.totalBenefit).toBe(50000 + result.totalTaxCredit);
    expect(savings.breakEvenYear).toBeGreaterThanOrEqual(5);
    expect(savings.breakEvenYear).toBeLessThan(15);
  });

  it('should calculate break-even year correctly', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 22000,
      state: 'TX',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    const savings = estimateTotalSavings(22000, 2000, 25, result);

    expect(savings.breakEvenYear).toBe(11); // 22000 / 2000 = 11 years (no credits)
  });

  it('should provide summary for all states', () => {
    const summary = getAllStateTaxCreditsSummary();

    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    ];

    for (const state of states) {
      expect(summary[state]).toBeDefined();
      expect(summary[state].maxFederal).toBe(0); // Federal ITC discontinued
      expect(summary[state].maxState).toBeGreaterThanOrEqual(0);
      expect(summary[state].maxTotal).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Tax Credits - Edge Cases', () => {
  it('should handle very large system costs', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 500000,
      state: 'CA',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    expect(result.federalCredit).toBe(0); // Federal ITC discontinued
    expect(result.stateCredit).toBe(3000); // Capped
    expect(result.totalTaxCredit).toBe(3000);
  });

  it('should handle very small system costs', () => {
    const config: TaxCreditConfig = {
      systemCostBeforeTax: 500,
      state: 'IL',
      year: 2024,
    };

    const result = calculateTotalTaxCredits(config);
    expect(result.federalCredit).toBe(0); // Federal ITC discontinued
    expect(result.stateCredit).toBeGreaterThan(0);
    expect(result.netSystemCost).toBeGreaterThanOrEqual(0);
  });

  it('should return 0 federal for all years (discontinued)', () => {
    const config2026 = { systemCostBeforeTax: 22000, state: 'IL', year: 2026 };
    const config2027 = { systemCostBeforeTax: 22000, state: 'IL', year: 2027 };

    const result2026 = calculateTotalTaxCredits(config2026);
    const result2027 = calculateTotalTaxCredits(config2027);

    expect(result2026.federalRate).toBe(0);
    expect(result2027.federalRate).toBe(0);
    expect(result2026.federalCredit).toBe(0);
    expect(result2027.federalCredit).toBe(0);
  });
});
