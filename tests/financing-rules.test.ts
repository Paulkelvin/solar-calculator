import { describe, it, expect } from 'vitest';
import {
  getCreditScoreBracket,
  calculateAPR,
  isLeaseAvailable,
  isPPAAvailable,
  isLoanAvailable,
  isCashAvailable,
  getFinancingEligibility,
  getStateFinancingRules,
  compareStateFinancing,
  getTopFinancingStates,
  getFinancingSummary,
  getLoanAvailabilityByScore,
  getLeaseAvailabilityDetail,
  getPPAAvailabilityDetail,
  countStatesByOptions,
} from '../src/lib/calculations/financing-rules';
import { CREDIT_SCORE_BRACKETS, LEASE_AVAILABLE_STATES, PPA_AVAILABLE_STATES } from '../types/financing-rules';

describe('Financing Rules Engine', () => {
  describe('Credit Score Brackets', () => {
    it('should return Poor bracket for 300-549', () => {
      const bracket = getCreditScoreBracket(500);
      expect(bracket.label).toBe('Poor');
      expect(bracket.aprAdjustment).toBe(3.5);
    });

    it('should return Fair bracket for 550-649', () => {
      const bracket = getCreditScoreBracket(600);
      expect(bracket.label).toBe('Fair');
      expect(bracket.aprAdjustment).toBe(2.0);
    });

    it('should return Good bracket for 650-699', () => {
      const bracket = getCreditScoreBracket(680);
      expect(bracket.label).toBe('Good');
      expect(bracket.aprAdjustment).toBe(0.5);
    });

    it('should return Good+ bracket for 700-749', () => {
      const bracket = getCreditScoreBracket(725);
      expect(bracket.label).toBe('Good+');
      expect(bracket.aprAdjustment).toBe(0);
    });

    it('should return Very Good bracket for 750-799', () => {
      const bracket = getCreditScoreBracket(775);
      expect(bracket.label).toBe('Very Good');
      expect(bracket.aprAdjustment).toBe(-0.5);
    });

    it('should return Excellent bracket for 800-850', () => {
      const bracket = getCreditScoreBracket(825);
      expect(bracket.label).toBe('Excellent');
      expect(bracket.aprAdjustment).toBe(-1.0);
    });

    it('should default to Excellent for scores above 850', () => {
      const bracket = getCreditScoreBracket(900);
      expect(bracket.label).toBe('Excellent');
      expect(bracket.aprAdjustment).toBe(-1.0);
    });

    it('should have all 6 brackets defined', () => {
      expect(CREDIT_SCORE_BRACKETS).toHaveLength(6);
    });
  });

  describe('APR Calculation', () => {
    it('should calculate APR for Poor credit (3.5% adjustment)', () => {
      const apr = calculateAPR(500);
      expect(apr).toBe(10.0); // 6.5 + 3.5
    });

    it('should calculate APR for Fair credit (2.0% adjustment)', () => {
      const apr = calculateAPR(600);
      expect(apr).toBe(8.5); // 6.5 + 2.0
    });

    it('should calculate APR for Good credit (0.5% adjustment)', () => {
      const apr = calculateAPR(680);
      expect(apr).toBe(7.0); // 6.5 + 0.5
    });

    it('should calculate APR for Good+ credit (0% adjustment)', () => {
      const apr = calculateAPR(725);
      expect(apr).toBe(6.5); // 6.5 + 0
    });

    it('should calculate APR for Very Good credit (-0.5% adjustment)', () => {
      const apr = calculateAPR(775);
      expect(apr).toBe(6.0); // 6.5 - 0.5
    });

    it('should calculate APR for Excellent credit (-1.0% adjustment)', () => {
      const apr = calculateAPR(825);
      expect(apr).toBe(5.5); // 6.5 - 1.0
    });

    it('should use default score 700 if not provided', () => {
      const apr = calculateAPR();
      expect(apr).toBe(6.5); // 6.5 + 0 (Good+ at 700)
    });

    it('should cap APR at 0% minimum', () => {
      const apr = calculateAPR(825); // Excellent -1.0
      expect(apr).toBeGreaterThanOrEqual(0);
    });

    it('should cap APR at 12% maximum', () => {
      const apr = calculateAPR(300);
      expect(apr).toBeLessThanOrEqual(12);
    });
  });

  describe('Financing Availability - Individual Options', () => {
    it('should always have cash available', () => {
      expect(isCashAvailable()).toBe(true);
    });

    it('should check loan availability by credit score', () => {
      expect(isLoanAvailable(700)).toBe(true);
      expect(isLoanAvailable(650)).toBe(true); // Minimum
      expect(isLoanAvailable(649)).toBe(false);
      expect(isLoanAvailable(300)).toBe(false);
    });

    it('should check lease availability by state', () => {
      expect(isLeaseAvailable('CA')).toBe(true);
      expect(isLeaseAvailable('NY')).toBe(true);
      expect(isLeaseAvailable('TX')).toBe(true);
      expect(isLeaseAvailable('FL')).toBe(true);
      expect(isLeaseAvailable('AL')).toBe(false);
      expect(isLeaseAvailable('AK')).toBe(false);
      expect(isLeaseAvailable('IN')).toBe(false);
    });

    it('should check PPA availability by state', () => {
      expect(isPPAAvailable('CA')).toBe(true);
      expect(isPPAAvailable('AZ')).toBe(true);
      expect(isPPAAvailable('NV')).toBe(true);
      expect(isPPAAvailable('UT')).toBe(true);
      expect(isPPAAvailable('TX')).toBe(false);
      expect(isPPAAvailable('FL')).toBe(false);
      expect(isPPAAvailable('NY')).toBe(false);
    });

    it('should verify lease available states count', () => {
      expect(LEASE_AVAILABLE_STATES).toHaveLength(20);
    });

    it('should verify PPA available states count', () => {
      expect(PPA_AVAILABLE_STATES).toHaveLength(4);
      expect(PPA_AVAILABLE_STATES).toEqual(['AZ', 'CA', 'NV', 'UT']);
    });

    it('should have case-insensitive state checks', () => {
      expect(isLeaseAvailable('ca')).toBe(true);
      expect(isLeaseAvailable('Ca')).toBe(true);
      expect(isPPAAvailable('ca')).toBe(true);
      expect(isPPAAvailable('Az')).toBe(true);
    });
  });

  describe('Financing Eligibility', () => {
    it('should allow cash in all states', () => {
      const eligibility = getFinancingEligibility({
        state: 'TX',
        creditScore: 500,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibility.availableOptions).toContain('cash');
    });

    it('should allow loan with credit score >= 650', () => {
      const eligibleElig = getFinancingEligibility({
        state: 'CA',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibleElig.availableOptions).toContain('loan');

      const ineligibleElig = getFinancingEligibility({
        state: 'CA',
        creditScore: 600,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(ineligibleElig.availableOptions).not.toContain('loan');
      expect(ineligibleElig.unavailableOptions).toHaveLength(1);
      expect(ineligibleElig.unavailableOptions[0].option).toBe('loan');
    });

    it('should allow lease only in available states', () => {
      const caElig = getFinancingEligibility({
        state: 'CA',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(caElig.availableOptions).toContain('lease');

      // TX is actually in lease available states
      const txElig = getFinancingEligibility({
        state: 'TX',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(txElig.availableOptions).toContain('lease');

      // AL does not have lease
      const alElig = getFinancingEligibility({
        state: 'AL',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(alElig.availableOptions).not.toContain('lease');
    });

    it('should allow PPA only in CA, AZ, NV, UT', () => {
      const caElig = getFinancingEligibility({
        state: 'CA',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(caElig.availableOptions).toContain('ppa');

      const nyElig = getFinancingEligibility({
        state: 'NY',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(nyElig.availableOptions).not.toContain('ppa');
    });

    it('should show all 4 options in CA with good credit', () => {
      const eligibility = getFinancingEligibility({
        state: 'CA',
        creditScore: 750,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibility.availableOptions).toEqual(
        expect.arrayContaining(['cash', 'loan', 'lease', 'ppa'])
      );
      expect(eligibility.availableOptions).toHaveLength(4);
    });

    it('should show only cash in poor credit, lease-unavailable state', () => {
      const eligibility = getFinancingEligibility({
        state: 'AL',
        creditScore: 500,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibility.availableOptions).toEqual(['cash']);
      expect(eligibility.unavailableOptions).toHaveLength(3); // loan, lease, ppa
    });

    it('should include recommendations', () => {
      const eligibility = getFinancingEligibility({
        state: 'CA',
        creditScore: 500,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibility.recommendations.length).toBeGreaterThan(0);
      expect(eligibility.recommendations[0]).toContain('credit score');
    });

    it('should use default credit score 700 if not provided', () => {
      const eligibility = getFinancingEligibility({
        state: 'CA',
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibility.creditScore).toBe(700);
      expect(eligibility.availableOptions).toContain('loan');
    });
  });

  describe('State Financing Rules', () => {
    it('should get all financing options for a state', () => {
      const rules = getStateFinancingRules('CA', 700);
      expect(rules.options).toHaveLength(4);
      expect(rules.options.map(o => o.option)).toContain('cash');
      expect(rules.options.map(o => o.option)).toContain('loan');
    });

    it('should include loan defaults', () => {
      const rules = getStateFinancingRules('CA', 700);
      expect(rules.loanTermYears).toBe(25);
      expect(rules.loanDownPaymentPercent).toBe(20);
      expect(rules.loanAprBase).toBe(6.5);
    });

    it('should mark unavailable options', () => {
      const rules = getStateFinancingRules('AL', 700);
      const leaseOption = rules.options.find(o => o.option === 'lease');
      expect(leaseOption?.available).toBe(false);
      expect(leaseOption?.notes).toContain('Not available');
    });
  });

  describe('State Comparison', () => {
    it('should compare financing across all 50 states', () => {
      const comparison = compareStateFinancing(700);
      expect(Object.keys(comparison)).toHaveLength(50);
    });

    it('should show different options for different states', () => {
      const comparison = compareStateFinancing(700);
      expect(comparison['CA']).toContain('ppa');
      expect(comparison['TX']).not.toContain('ppa');
    });

    it('should include top financing states', () => {
      const topStates = getTopFinancingStates();
      expect(topStates).toContain('CA');
      expect(topStates).toContain('AZ');
      expect(topStates).toContain('NV');
      expect(topStates).toContain('UT');
    });
  });

  describe('Financing Summary', () => {
    it('should provide complete financing summary', () => {
      const summary = getFinancingSummary('CA', 750);
      expect(summary.state).toBe('CA');
      expect(summary.creditScore).toBe(750);
      expect(summary.creditLabel).toBe('Very Good');
      expect(summary.apr).toBe(6.0);
      expect(summary.availableCount).toBe(4);
      expect(summary.hasCash).toBe(true);
      expect(summary.hasLoan).toBe(true);
      expect(summary.hasLease).toBe(true);
      expect(summary.hasPPA).toBe(true);
    });

    it('should show no lease/PPA in limited states', () => {
      // AL has no lease or PPA
      const summary = getFinancingSummary('AL', 700);
      expect(summary.availableCount).toBe(2); // cash + loan
      expect(summary.hasLease).toBe(false);
      expect(summary.hasPPA).toBe(false);

      // TX has lease but no PPA
      const txSummary = getFinancingSummary('TX', 700);
      expect(txSummary.availableCount).toBe(3); // cash + loan + lease
      expect(txSummary.hasLease).toBe(true);
      expect(txSummary.hasPPA).toBe(false);
    });

    it('should show different APR for different credit scores', () => {
      const goodSummary = getFinancingSummary('CA', 650);
      const excellentSummary = getFinancingSummary('CA', 825);
      expect(goodSummary.apr).toBeGreaterThan(excellentSummary.apr);
    });
  });

  describe('Loan Availability by Credit Score Tier', () => {
    it('should deny loan for poor credit < 550', () => {
      const result = getLoanAvailabilityByScore(500);
      expect(result.isAvailable).toBe(false);
      expect(result.tier).toBe('none');
      expect(result.message).toContain('Poor');
    });

    it('should deny loan for fair credit 550-649', () => {
      const result = getLoanAvailabilityByScore(600);
      expect(result.isAvailable).toBe(false);
      expect(result.tier).toBe('unavailable');
      expect(result.message).toContain('650');
    });

    it('should allow loan for good credit 650+', () => {
      const result = getLoanAvailabilityByScore(700);
      expect(result.isAvailable).toBe(true);
      expect(result.tier).toBe('very-good');
      expect(result.apr).toBe(6.5);
    });

    it('should show best rates for excellent credit', () => {
      const result = getLoanAvailabilityByScore(825);
      expect(result.isAvailable).toBe(true);
      expect(result.tier).toBe('excellent');
      expect(result.apr).toBe(5.5);
      expect(result.message).toContain('best');
    });
  });

  describe('Lease Availability Detail', () => {
    it('should show lease available in CA', () => {
      const detail = getLeaseAvailabilityDetail('CA');
      expect(detail.hasLeasePrograms).toBe(true);
      expect(detail.providers).toContain('Sunrun');
    });

    it('should show lease unavailable in AL', () => {
      const detail = getLeaseAvailabilityDetail('AL');
      expect(detail.hasLeasePrograms).toBe(false);
      expect(detail.providers).toBeUndefined();
      expect(detail.notes).toContain('not available');
    });

    it('should list providers for available states', () => {
      for (const state of LEASE_AVAILABLE_STATES) {
        const detail = getLeaseAvailabilityDetail(state);
        expect(detail.hasLeasePrograms).toBe(true);
        expect(detail.providers).toBeDefined();
        expect(detail.providers!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('PPA Availability Detail', () => {
    it('should show PPA available only in 4 states', () => {
      const availableStates = ['AZ', 'CA', 'NV', 'UT'];
      for (const state of availableStates) {
        const detail = getPPAAvailabilityDetail(state);
        expect(detail.hasPPAPrograms).toBe(true);
      }
    });

    it('should show PPA unavailable in most states', () => {
      const unavailableStates = ['TX', 'FL', 'NY', 'IL', 'OH'];
      for (const state of unavailableStates) {
        const detail = getPPAAvailabilityDetail(state);
        expect(detail.hasPPAPrograms).toBe(false);
        expect(detail.providers).toBeUndefined();
      }
    });
  });

  describe('State Options Count', () => {
    it('should count states by available financing options', () => {
      const counts = countStatesByOptions();
      expect(counts.allFour).toBeGreaterThan(0); // CA, AZ, NV, UT have all 4
      expect(counts.threeOptions).toBeGreaterThan(0); // States with lease but no PPA
      expect(counts.twoOptions).toBeGreaterThan(0); // States with loan + cash only
      expect(counts.onlyLoan).toBe(0); // All states have cash
      expect(counts.onlyCash).toBe(0); // No states with only cash (at least loan available)
    });

    it('should sum to 50 states', () => {
      const counts = countStatesByOptions();
      const total = counts.allFour + counts.threeOptions + counts.twoOptions + counts.onlyLoan + counts.onlyCash;
      expect(total).toBe(50);
    });

    it('should show CA, AZ, NV, UT have all 4 options', () => {
      const counts = countStatesByOptions();
      expect(counts.allFour).toBeGreaterThanOrEqual(4); // At least these 4
    });
  });

  describe('Edge Cases', () => {
    it('should handle state code case insensitivity', () => {
      const eligibilityUpper = getFinancingEligibility({
        state: 'CA',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      const eligibilityLower = getFinancingEligibility({
        state: 'ca',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibilityUpper.availableOptions).toEqual(eligibilityLower.availableOptions);
    });

    it('should handle credit score boundary 650', () => {
      const atBoundary = isLoanAvailable(650);
      const belowBoundary = isLoanAvailable(649);
      expect(atBoundary).toBe(true);
      expect(belowBoundary).toBe(false);
    });

    it('should handle missing credit score with 700 default', () => {
      const eligibility1 = getFinancingEligibility({
        state: 'CA',
        systemSize: 8,
        systemCost: 22000,
      });
      const eligibility2 = getFinancingEligibility({
        state: 'CA',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibility1.availableOptions).toEqual(eligibility2.availableOptions);
    });

    it('should handle extreme credit scores', () => {
      expect(() => calculateAPR(0)).not.toThrow();
      expect(() => calculateAPR(1000)).not.toThrow();
      const apr0 = calculateAPR(0);
      const apr1000 = calculateAPR(1000);
      expect(apr0).toBeGreaterThanOrEqual(0);
      expect(apr1000).toBeLessThanOrEqual(12);
    });

    it('should handle all 50 states in comparison', () => {
      const comparison = compareStateFinancing(700);
      const allStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      ];
      for (const state of allStates) {
        expect(comparison[state]).toBeDefined();
        expect(comparison[state].length).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should recommend best option for excellent credit in CA', () => {
      const eligibility = getFinancingEligibility({
        state: 'CA',
        creditScore: 825,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibility.availableOptions).toHaveLength(4);
      expect(eligibility.recommendations).toContain('Excellent credit score! You qualify for premium loan rates.');
    });

    it('should recommend improvement for poor credit', () => {
      const eligibility = getFinancingEligibility({
        state: 'CA',
        creditScore: 500,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(eligibility.availableOptions).toEqual(['cash', 'lease', 'ppa']);
      expect(eligibility.recommendations.length).toBeGreaterThan(0);
      expect(eligibility.recommendations.some(r => r.includes('Improve'))).toBe(true);
    });

    it('should explain limited options in limited states', () => {
      // AL has only cash + loan (no lease/PPA)
      const alElig = getFinancingEligibility({
        state: 'AL',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(alElig.availableOptions).toEqual(['cash', 'loan']);
      expect(alElig.recommendations.some(r => r.includes('cash or loan'))).toBe(true);

      // TX has cash + loan + lease (no PPA)
      const txElig = getFinancingEligibility({
        state: 'TX',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      expect(txElig.availableOptions).toEqual(['cash', 'loan', 'lease']);
    });

    it('should combine all data sources correctly', () => {
      const eligibility = getFinancingEligibility({
        state: 'CA',
        creditScore: 700,
        systemSize: 8,
        systemCost: 22000,
      });
      const apr = calculateAPR(700);
      const lease = getLeaseAvailabilityDetail('CA');
      const ppa = getPPAAvailabilityDetail('CA');

      expect(eligibility.availableOptions).toContain('loan');
      expect(apr).toBe(6.5);
      expect(lease.hasLeasePrograms).toBe(true);
      expect(ppa.hasPPAPrograms).toBe(true);
    });
  });
});
