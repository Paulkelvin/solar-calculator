import { describe, it, expect } from 'vitest';
import {
  getCreditScoreIntegration,
  isFinancingOptionAvailable,
  getAvailableFinancingOptions,
  getUnavailableReason,
  sortFinancingOptions,
  getCreditImprovementPath,
  getAPRRange,
  calculateMonthlyLoanPayment,
  getFinancingScoreFactor,
  buildFinancingCardData,
} from '../src/lib/calculations/credit-score-integration';
import type { CalculatorForm } from '../types';

describe('Credit Score Integration', () => {
  describe('Credit Score Integration Details', () => {
    it('should provide integration details for CA with good credit', () => {
      const integration = getCreditScoreIntegration('CA', 700, 8, 22000);
      expect(integration.creditScore).toBe(700);
      expect(integration.creditBracket).toBe('Good+');
      expect(integration.apr).toBe(6.5);
      expect(integration.availableFinancingOptions).toHaveLength(4);
      expect(integration.availableFinancingOptions).toContain('lease');
      expect(integration.availableFinancingOptions).toContain('ppa');
    });

    it('should provide integration details for AL with poor credit', () => {
      const integration = getCreditScoreIntegration('AL', 500, 8, 22000);
      expect(integration.creditScore).toBe(500);
      expect(integration.creditBracket).toBe('Poor');
      expect(integration.apr).toBe(10.0); // 6.5 + 3.5
      expect(integration.availableFinancingOptions).toEqual(['cash']);
      expect(integration.loanEligibility.available).toBe(false);
    });

    it('should provide integration for TX with fair credit', () => {
      const integration = getCreditScoreIntegration('TX', 600, 8, 22000);
      expect(integration.creditScore).toBe(600);
      expect(integration.creditBracket).toBe('Fair');
      expect(integration.apr).toBe(8.5); // 6.5 + 2.0
      expect(integration.availableFinancingOptions).toEqual(['cash', 'lease']);
      expect(integration.loanEligibility.available).toBe(false);
    });

    it('should provide integration for excellent credit', () => {
      const integration = getCreditScoreIntegration('CA', 825, 8, 22000);
      expect(integration.creditScore).toBe(825);
      expect(integration.creditBracket).toBe('Excellent');
      expect(integration.apr).toBe(5.5); // 6.5 - 1.0
      expect(integration.availableFinancingOptions).toHaveLength(4);
      expect(integration.loanEligibility.available).toBe(true);
      expect(integration.loanEligibility.tier).toBe('excellent');
    });
  });

  describe('Financing Option Availability', () => {
    it('should check individual option availability', () => {
      expect(isFinancingOptionAvailable('cash', 'CA', 700)).toBe(true);
      expect(isFinancingOptionAvailable('loan', 'CA', 700)).toBe(true);
      expect(isFinancingOptionAvailable('lease', 'CA', 700)).toBe(true);
      expect(isFinancingOptionAvailable('ppa', 'CA', 700)).toBe(true);
    });

    it('should deny PPA outside 4 states', () => {
      expect(isFinancingOptionAvailable('ppa', 'NY', 700)).toBe(false);
      expect(isFinancingOptionAvailable('ppa', 'TX', 700)).toBe(false);
      expect(isFinancingOptionAvailable('ppa', 'AL', 700)).toBe(false);
    });

    it('should deny loan for poor credit', () => {
      expect(isFinancingOptionAvailable('loan', 'CA', 500)).toBe(false);
      expect(isFinancingOptionAvailable('loan', 'CA', 600)).toBe(false);
      expect(isFinancingOptionAvailable('loan', 'CA', 650)).toBe(true);
    });

    it('should always have cash available', () => {
      expect(isFinancingOptionAvailable('cash', 'AL', 300)).toBe(true);
      expect(isFinancingOptionAvailable('cash', 'WY', 500)).toBe(true);
      expect(isFinancingOptionAvailable('cash', 'UT', 650)).toBe(true);
    });

    it('should get all available options', () => {
      const optionsCA = getAvailableFinancingOptions('CA', 700);
      expect(optionsCA).toContain('cash');
      expect(optionsCA).toContain('loan');
      expect(optionsCA).toContain('lease');
      expect(optionsCA).toContain('ppa');

      const optionsAL = getAvailableFinancingOptions('AL', 700);
      expect(optionsAL).toEqual(['cash', 'loan']);
    });

    it('should get unavailable reasons', () => {
      const reason = getUnavailableReason('ppa', 'NY', 700);
      expect(reason).toBeTruthy();
      expect(reason).toContain('not available');

      const nReason = getUnavailableReason('cash', 'CA', 700);
      expect(nReason).toBeNull();
    });
  });

  describe('Financing Option Sorting', () => {
    it('should sort options by preference (lease > ppa > loan > cash)', () => {
      const options: ('cash' | 'loan' | 'lease' | 'ppa')[] = ['cash', 'loan', 'lease', 'ppa'];
      const sorted = sortFinancingOptions(options);
      expect(sorted[0]).toBe('lease');
      expect(sorted[1]).toBe('ppa');
      expect(sorted[2]).toBe('loan');
      expect(sorted[3]).toBe('cash');
    });

    it('should handle partial options', () => {
      const options: ('cash' | 'loan' | 'lease' | 'ppa')[] = ['cash', 'loan'];
      const sorted = sortFinancingOptions(options);
      expect(sorted[0]).toBe('loan');
      expect(sorted[1]).toBe('cash');
    });

    it('should handle single option', () => {
      const options: ('cash' | 'loan' | 'lease' | 'ppa')[] = ['cash'];
      const sorted = sortFinancingOptions(options);
      expect(sorted).toEqual(['cash']);
    });
  });

  describe('Credit Score Improvement Path', () => {
    it('should show improvement path from poor to fair', () => {
      const path = getCreditImprovementPath(500);
      expect(path.currentTier).toBe('Poor');
      expect(path.nextTier).toBe('Fair');
      expect(path.scoreNeeded).toBe(550);
      expect(path.improvement).toBe(50);
      expect(path.benefits.length).toBeGreaterThan(0);
    });

    it('should show improvement path from fair to good', () => {
      const path = getCreditImprovementPath(600);
      expect(path.currentTier).toBe('Fair');
      expect(path.nextTier).toBe('Good');
      expect(path.scoreNeeded).toBe(650);
      expect(path.improvement).toBe(50);
      expect(path.benefits).toContain('Good credit makes you loan eligible');
    });

    it('should show improvement path from good+ to very good', () => {
      const path = getCreditImprovementPath(725);
      expect(path.currentTier).toBe('Good+');
      expect(path.nextTier).toBe('Very Good');
      expect(path.scoreNeeded).toBe(750);
      expect(path.improvement).toBe(25);
      expect(path.benefits).toContain('Very good credit reduces APR by 0.5%');
    });

    it('should show no improvement needed for excellent credit', () => {
      const path = getCreditImprovementPath(825);
      expect(path.currentTier).toBe('Excellent');
      expect(path.improvement).toBe(0);
      expect(path.benefits).toContain('You have excellent credit! Enjoy the best rates available.');
    });

    it('should show APR improvement benefits', () => {
      const path = getCreditImprovementPath(700);
      expect(path.benefits.length).toBeGreaterThan(0);
    });
  });

  describe('APR Range Calculation', () => {
    it('should calculate APR range', () => {
      const range = getAPRRange('CA');
      expect(range.minAPR).toBe(5.5); // Excellent (850)
      expect(range.maxAPR).toBe(10.0); // Poor (300)
      expect(range.minAPR).toBeLessThan(range.maxAPR);
    });

    it('should show score boundaries', () => {
      const range = getAPRRange('TX');
      expect(range.minScore).toBe(850);
      expect(range.maxScore).toBe(300);
    });
  });

  describe('Monthly Loan Payment Calculation', () => {
    it('should calculate payment with positive APR', () => {
      // $22,000 at 6.5% for 25 years
      const payment = calculateMonthlyLoanPayment(22000, 6.5, 25);
      expect(payment).toBeGreaterThan(0);
      expect(payment).toBeLessThan(200); // Sanity check
      // Roughly $148-149/month
      expect(payment).toBeCloseTo(148.5, -1);
    });

    it('should calculate payment with high APR', () => {
      // $22,000 at 10% for 25 years
      const payment = calculateMonthlyLoanPayment(22000, 10.0, 25);
      expect(payment).toBeGreaterThan(0);
      // Should be higher than 6.5% rate
      const lowerPayment = calculateMonthlyLoanPayment(22000, 6.5, 25);
      expect(payment).toBeGreaterThan(lowerPayment);
    });

    it('should calculate payment with low APR', () => {
      // $22,000 at 5.5% for 25 years
      const payment = calculateMonthlyLoanPayment(22000, 5.5, 25);
      expect(payment).toBeGreaterThan(0);
      // Should be lower than 6.5% rate
      const higherPayment = calculateMonthlyLoanPayment(22000, 6.5, 25);
      expect(payment).toBeLessThan(higherPayment);
    });

    it('should handle 0% APR', () => {
      // $22,000 at 0% for 25 years = $22,000 / 300 months
      const payment = calculateMonthlyLoanPayment(22000, 0, 25);
      expect(payment).toBeCloseTo(73.33, 2);
    });

    it('should show APR impact on payment', () => {
      const payment5 = calculateMonthlyLoanPayment(22000, 5.5, 25);
      const payment10 = calculateMonthlyLoanPayment(22000, 10.0, 25);
      const difference = payment10 - payment5;
      expect(difference).toBeGreaterThan(0);
      // Roughly $65/month difference
      expect(difference).toBeCloseTo(65, 0);
    });
  });

  describe('Financing Score Factor', () => {
    it('should give high score for excellent credit in multi-option state', () => {
      const score = getFinancingScoreFactor('CA', 825, 'loan');
      expect(score).toBeGreaterThan(1.5);
    });

    it('should give low score for poor credit in limited state', () => {
      const score = getFinancingScoreFactor('AL', 500, 'cash');
      expect(score).toBeLessThan(0.75);
    });

    it('should increase score for available financing type', () => {
      const scoreAvailable = getFinancingScoreFactor('CA', 700, 'lease');
      const scoreUnavailable = getFinancingScoreFactor('AL', 700, 'ppa');
      expect(scoreAvailable).toBeGreaterThan(scoreUnavailable);
    });

    it('should scale with credit tier', () => {
      const scorePoor = getFinancingScoreFactor('CA', 500, 'cash');
      const scoreGood = getFinancingScoreFactor('CA', 700, 'cash');
      const scoreExcellent = getFinancingScoreFactor('CA', 825, 'cash');
      expect(scorePoor).toBeLessThan(scoreGood);
      expect(scoreGood).toBeLessThan(scoreExcellent);
    });
  });

  describe('Financing Card Data Building', () => {
    it('should build complete financing card data', () => {
      const form: CalculatorForm = {
        address: { street: '123 Main', city: 'LA', state: 'CA', zip: '90001' },
        usage: { monthlyKwh: 1000 },
        roof: { roofType: 'asphalt', squareFeet: 2000, sunExposure: 'good' },
        preferences: { wantsBattery: false, financingType: 'loan', creditScore: 700, timeline: '3-months', notes: '' },
        contact: { name: 'John', email: 'john@test.com', phone: '5551234567' },
      };

      const cardData = buildFinancingCardData(form, 8, 22000, 1000);
      expect(cardData.creditScore).toBe(700);
      expect(cardData.creditBracket).toBe('Good+');
      expect(cardData.apr).toBe(6.5);
      expect(cardData.availableOptions).toContain('loan');
      expect(cardData.cards.cash).toBeDefined();
      expect(cardData.cards.loan).toBeDefined();
    });

    it('should exclude loan card for poor credit', () => {
      const form: CalculatorForm = {
        address: { street: '123 Main', city: 'LA', state: 'CA', zip: '90001' },
        usage: { monthlyKwh: 1000 },
        roof: { roofType: 'asphalt', squareFeet: 2000, sunExposure: 'good' },
        preferences: { wantsBattery: false, financingType: 'cash', creditScore: 500, timeline: '3-months', notes: '' },
        contact: { name: 'John', email: 'john@test.com', phone: '5551234567' },
      };

      const cardData = buildFinancingCardData(form, 8, 22000, 1000);
      expect(cardData.cards.loan).toBeNull();
      expect(cardData.cards.cash).toBeDefined();
    });

    it('should exclude PPA outside 4 states', () => {
      const form: CalculatorForm = {
        address: { street: '123 Main', city: 'New York', state: 'NY', zip: '10001' },
        usage: { monthlyKwh: 1000 },
        roof: { roofType: 'asphalt', squareFeet: 2000, sunExposure: 'good' },
        preferences: { wantsBattery: false, financingType: 'loan', creditScore: 700, timeline: '3-months', notes: '' },
        contact: { name: 'John', email: 'john@test.com', phone: '5551234567' },
      };

      const cardData = buildFinancingCardData(form, 8, 22000, 1000);
      expect(cardData.cards.ppa).toBeNull();
      expect(cardData.cards.lease).toBeDefined();
    });

    it('should calculate loan monthly payment', () => {
      const form: CalculatorForm = {
        address: { street: '123 Main', city: 'LA', state: 'CA', zip: '90001' },
        usage: { monthlyKwh: 1000 },
        roof: { roofType: 'asphalt', squareFeet: 2000, sunExposure: 'good' },
        preferences: { wantsBattery: false, financingType: 'loan', creditScore: 700, timeline: '3-months', notes: '' },
        contact: { name: 'John', email: 'john@test.com', phone: '5551234567' },
      };

      const cardData = buildFinancingCardData(form, 8, 22000, 1000);
      if (cardData.cards.loan) {
        expect(cardData.cards.loan.monthlyPayment).toBeGreaterThan(0);
        expect(cardData.cards.loan.monthlyPayment).toBeLessThan(200);
      }
    });

    it('should show all 4 options in CA with excellent credit', () => {
      const form: CalculatorForm = {
        address: { street: '123 Main', city: 'LA', state: 'CA', zip: '90001' },
        usage: { monthlyKwh: 1000 },
        roof: { roofType: 'asphalt', squareFeet: 2000, sunExposure: 'good' },
        preferences: { wantsBattery: false, financingType: 'loan', creditScore: 825, timeline: '3-months', notes: '' },
        contact: { name: 'John', email: 'john@test.com', phone: '5551234567' },
      };

      const cardData = buildFinancingCardData(form, 8, 22000, 1000);
      expect(cardData.availableOptions).toHaveLength(4);
      expect(cardData.cards.cash).toBeDefined();
      expect(cardData.cards.loan).toBeDefined();
      expect(cardData.cards.lease).toBeDefined();
      expect(cardData.cards.ppa).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle default credit score', () => {
      const integration = getCreditScoreIntegration('CA', undefined as any, 8, 22000);
      expect(integration.creditScore).toBe(700);
    });

    it('should handle case-insensitive states', () => {
      const upper = getCreditScoreIntegration('ca', 700, 8, 22000);
      const lower = getCreditScoreIntegration('CA', 700, 8, 22000);
      expect(upper.availableFinancingOptions).toEqual(lower.availableFinancingOptions);
    });

    it('should handle all 50 states', () => {
      const states = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      ];

      for (const state of states) {
        const integration = getCreditScoreIntegration(state, 700, 8, 22000);
        expect(integration.availableFinancingOptions.length).toBeGreaterThan(0);
      }
    });

    it('should handle credit score boundaries', () => {
      expect(() => getCreditScoreIntegration('CA', 300, 8, 22000)).not.toThrow();
      expect(() => getCreditScoreIntegration('CA', 850, 8, 22000)).not.toThrow();
      expect(() => getCreditScoreIntegration('CA', 0, 8, 22000)).not.toThrow();
      expect(() => getCreditScoreIntegration('CA', 1000, 8, 22000)).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle excellent credit in best state (CA)', () => {
      const integration = getCreditScoreIntegration('CA', 825, 8, 22000);
      expect(integration.availableFinancingOptions).toHaveLength(4);
      expect(integration.apr).toBe(5.5);
      expect(integration.creditBracket).toBe('Excellent');
      expect(integration.loanEligibility.available).toBe(true);
    });

    it('should handle poor credit in limited state (AL)', () => {
      const integration = getCreditScoreIntegration('AL', 500, 8, 22000);
      expect(integration.availableFinancingOptions).toEqual(['cash']);
      expect(integration.apr).toBe(10.0);
      expect(integration.loanEligibility.available).toBe(false);
    });

    it('should handle moderate credit in moderate state (TX)', () => {
      const integration = getCreditScoreIntegration('TX', 700, 8, 22000);
      expect(integration.availableFinancingOptions).toEqual(
        expect.arrayContaining(['cash', 'loan', 'lease'])
      );
      expect(integration.apr).toBe(6.5);
      expect(integration.loanEligibility.available).toBe(true);
    });
  });
});
