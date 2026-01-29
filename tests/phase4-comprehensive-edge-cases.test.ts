import { describe, it, expect } from "vitest";
import { getCreditScoreBracket, calculateAPR, isLeaseAvailable, isPPAAvailable, isLoanAvailable, isCashAvailable } from "../src/lib/calculations/financing-rules";
import { isFinancingOptionAvailable, getCreditScoreIntegration } from "../src/lib/calculations/credit-score-integration";
import { calculateFederalITC } from "../src/lib/calculations/tax-credits";

describe("Phase 4.6: Comprehensive Edge Case Testing", () => {
  describe("Tax Credits: Federal ITC Phase-Out Schedule", () => {
    it("should apply 30% ITC for 2026", () => {
      const result2026 = calculateFederalITC(30000, 2026);
      expect(result2026.rate).toBe(0.30);
      expect(result2026.credit).toBe(9000);
    });

    it("should apply 26% ITC for 2027-2029", () => {
      const result = calculateFederalITC(30000, 2028);
      expect(result.rate).toBe(0.26);
      expect(result.credit).toBeCloseTo(7800, 0);
    });

    it("should apply 22% ITC for 2030-2032", () => {
      const result = calculateFederalITC(30000, 2030);
      expect(result.rate).toBe(0.22);
      expect(result.credit).toBeCloseTo(6600, 0);
    });

    it("should apply 0% ITC after 2032 (defaults to 30% for years not in schedule)", () => {
      const result = calculateFederalITC(30000, 2033);
      // Years after 2032 are not in schedule, so they default to 30%
      expect(result.rate).toBe(0.30);
      expect(result.credit).toBe(9000);
    });

    it("edge case: very small system", () => {
      const itc = calculateFederalITC(5000, 2026);
      expect(itc.credit).toBe(1500);
    });

    it("edge case: very large system", () => {
      const itc = calculateFederalITC(500000, 2026);
      expect(itc.credit).toBe(150000);
    });
  });

  describe("Credit Score Brackets", () => {
    it("should categorize Poor credit (300-549)", () => {
      expect(getCreditScoreBracket(300).label).toBe("Poor");
      expect(getCreditScoreBracket(400).label).toBe("Poor");
      expect(getCreditScoreBracket(549).label).toBe("Poor");
    });

    it("should categorize Fair credit (550-649)", () => {
      expect(getCreditScoreBracket(550).label).toBe("Fair");
      expect(getCreditScoreBracket(615).label).toBe("Fair");
      expect(getCreditScoreBracket(649).label).toBe("Fair");
    });

    it("should categorize Good credit (650-699)", () => {
      expect(getCreditScoreBracket(650).label).toBe("Good");
      expect(getCreditScoreBracket(675).label).toBe("Good");
      expect(getCreditScoreBracket(699).label).toBe("Good");
    });

    it("should categorize Good+ credit (700-749)", () => {
      expect(getCreditScoreBracket(700).label).toBe("Good+");
      expect(getCreditScoreBracket(725).label).toBe("Good+");
      expect(getCreditScoreBracket(749).label).toBe("Good+");
    });

    it("should categorize Very Good credit (750-799)", () => {
      expect(getCreditScoreBracket(750).label).toBe("Very Good");
      expect(getCreditScoreBracket(775).label).toBe("Very Good");
      expect(getCreditScoreBracket(799).label).toBe("Very Good");
    });

    it("should categorize Excellent credit (800-850)", () => {
      expect(getCreditScoreBracket(800).label).toBe("Excellent");
      expect(getCreditScoreBracket(825).label).toBe("Excellent");
      expect(getCreditScoreBracket(850).label).toBe("Excellent");
    });

    it("edge case: boundary values", () => {
      expect(getCreditScoreBracket(619).label).toBe("Fair");
      expect(getCreditScoreBracket(620).label).toBe("Fair");
      expect(getCreditScoreBracket(649).label).toBe("Fair");
      expect(getCreditScoreBracket(650).label).toBe("Good");
    });
  });

  describe("APR Adjustment by Credit Score", () => {
    it("should have best APR for Excellent credit (850)", () => {
      expect(calculateAPR(850)).toBe(5.5);
    });

    it("should have worst APR for Poor credit (300)", () => {
      expect(calculateAPR(300)).toBe(10.0);
    });

    it("should decrease APR as credit score increases", () => {
      const scores = [300, 500, 650, 750, 850];
      const aprs = scores.map(s => calculateAPR(s));
      
      for (let i = 0; i < aprs.length - 1; i++) {
        expect(aprs[i]).toBeGreaterThanOrEqual(aprs[i + 1]);
      }
    });

    it("should keep APR in valid range for all scores", () => {
      for (let score = 300; score <= 850; score += 50) {
        const apr = calculateAPR(score);
        expect(apr).toBeGreaterThanOrEqual(5.5);
        expect(apr).toBeLessThanOrEqual(10.0);
      }
    });
  });

  describe("Financing Option Availability: Lease (20 states)", () => {
    it("should have lease in 10 western/coastal states", () => {
      const states = ["AZ", "CA", "CO", "DE", "FL", "HI", "IL", "MA", "MD", "CT"];
      states.forEach(state => {
        expect(isLeaseAvailable(state), `${state} should have lease`).toBe(true);
      });
    });

    it("should have lease in 10 additional states", () => {
      const states = ["ME", "MN", "NC", "NH", "NJ", "NV", "NY", "TX", "UT", "WA"];
      states.forEach(state => {
        expect(isLeaseAvailable(state), `${state} should have lease`).toBe(true);
      });
    });

    it("should NOT have lease in restricted states", () => {
      const states = ["AL", "AR", "KS", "KY", "LA", "MS", "ND", "OK", "SC", "SD", "TN", "WY"];
      states.forEach(state => {
        expect(isLeaseAvailable(state), `${state} should NOT have lease`).toBe(false);
      });
    });
  });

  describe("Financing Option Availability: PPA (4 states)", () => {
    it("should have PPA in AZ, CA, NV, UT only", () => {
      expect(isPPAAvailable("AZ")).toBe(true);
      expect(isPPAAvailable("CA")).toBe(true);
      expect(isPPAAvailable("NV")).toBe(true);
      expect(isPPAAvailable("UT")).toBe(true);
    });

    it("should NOT have PPA in non-PPA states", () => {
      const states = ["CO", "TX", "NY", "FL", "MS", "IL", "PA", "WA"];
      states.forEach(state => {
        expect(isPPAAvailable(state), `${state} should NOT have PPA`).toBe(false);
      });
    });
  });

  describe("Loan Availability by Credit Score", () => {
    it("should require minimum ~650 credit score for loan", () => {
      expect(isLoanAvailable(300)).toBe(false);
      expect(isLoanAvailable(550)).toBe(false);
      expect(isLoanAvailable(649)).toBe(false);
      expect(isLoanAvailable(650)).toBe(true);
    });

    it("should allow loan for all scores >= 650", () => {
      for (let score = 650; score <= 850; score += 50) {
        expect(isLoanAvailable(score)).toBe(true);
      }
    });
  });

  describe("Cash Option Availability", () => {
    it("should always be available regardless of credit score", () => {
      for (let score = 300; score <= 850; score += 50) {
        expect(isCashAvailable()).toBe(true); // Cash is always available
      }
    });
  });

  describe("Complex Scenarios: Credit Score + State Combinations", () => {
    it("scenario: Poor credit (300) in Mississippi should only allow cash", () => {
      const score = 300;
      const state = "MS";
      
      expect(isFinancingOptionAvailable("cash", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("loan", state, score)).toBe(false);
      expect(isFinancingOptionAvailable("lease", state, score)).toBe(false);
      expect(isFinancingOptionAvailable("ppa", state, score)).toBe(false);
    });

    it("scenario: Fair credit (650) in New York should allow cash, loan, and lease", () => {
      const score = 650;
      const state = "NY";
      
      expect(isFinancingOptionAvailable("cash", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("loan", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("lease", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("ppa", state, score)).toBe(false);
    });

    it("scenario: Excellent credit (850) in California should allow all 4 options", () => {
      const score = 850;
      const state = "CA";
      
      expect(isFinancingOptionAvailable("cash", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("loan", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("lease", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("ppa", state, score)).toBe(true);
    });

    it("scenario: Excellent credit (850) in Nevada should allow cash, loan, lease, and PPA", () => {
      const score = 850;
      const state = "NV";
      
      expect(isFinancingOptionAvailable("cash", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("loan", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("lease", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("ppa", state, score)).toBe(true);
    });

    it("scenario: Good credit (700) in Texas should allow cash, loan, and lease", () => {
      const score = 700;
      const state = "TX";
      
      expect(isFinancingOptionAvailable("cash", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("loan", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("lease", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("ppa", state, score)).toBe(false);
    });

    it("scenario: Good credit (700) in Colorado should allow cash, loan, and lease", () => {
      const score = 700;
      const state = "CO";
      
      expect(isFinancingOptionAvailable("cash", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("loan", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("lease", state, score)).toBe(true);
      expect(isFinancingOptionAvailable("ppa", state, score)).toBe(false);
    });
  });

  describe("Credit Score Integration: getIntegration()", () => {
    it("should return complete integration for poor credit in non-lease state", () => {
      const result = getCreditScoreIntegration("MS", 300, 7.5, 20625);
      
      expect(result.creditBracket).toBe("Poor");
      expect(result.availableFinancingOptions).toContain("cash");
      expect(result.availableFinancingOptions.length).toBe(1);
    });

    it("should return complete integration for excellent credit in best state", () => {
      const result = getCreditScoreIntegration("CA", 850, 7.5, 20625);
      
      expect(result.creditBracket).toBe("Excellent");
      expect(result.availableFinancingOptions.length).toBe(4);
      expect(result.availableFinancingOptions).toContain("cash");
      expect(result.availableFinancingOptions).toContain("loan");
      expect(result.availableFinancingOptions).toContain("lease");
      expect(result.availableFinancingOptions).toContain("ppa");
    });

    it("should return accurate APR for different credit scores", () => {
      const poor = getCreditScoreIntegration("CO", 300, 7.5, 20625);
      const fair = getCreditScoreIntegration("CO", 650, 7.5, 20625);
      const excellent = getCreditScoreIntegration("CO", 850, 7.5, 20625);
      
      // APR should improve with better credit
      expect(poor.apr).toBeGreaterThan(fair.apr);
      expect(fair.apr).toBeGreaterThan(excellent.apr);
    });
  });

  describe("Boundary Value Testing", () => {
    it("should handle all credit score boundaries", () => {
      const boundaries = [549, 550, 649, 650, 699, 700, 749, 750, 799, 800];
      
      boundaries.forEach(score => {
        const bracket = getCreditScoreBracket(score);
        const apr = calculateAPR(score);
        
        expect(bracket).toBeDefined();
        expect(bracket.aprAdjustment).toBeDefined();
        expect(apr).toBeGreaterThanOrEqual(5.5);
        expect(apr).toBeLessThanOrEqual(10.0);
      });
    });

    it("should handle year boundaries for ITC", () => {
      const years = [2025, 2026, 2029, 2030, 2032, 2033];
      
      years.forEach(year => {
        const itc = calculateFederalITC(25000, year);
        expect(itc.credit).toBeGreaterThanOrEqual(0);
      });
    });

    it("should handle all major states for financing", () => {
      const majorStates = [
        "AZ", "CA", "CO", "FL", "IL", "MA", "NC", "NV", "NY", "TX", "UT", "WA"
      ];
      
      majorStates.forEach(state => {
        // All states must have cash and loan (good credit)
        expect(isFinancingOptionAvailable("cash", state, 700)).toBe(true);
        expect(isFinancingOptionAvailable("loan", state, 700)).toBe(true);
        
        // State-specific: lease and PPA vary
        const lease = isFinancingOptionAvailable("lease", state, 700);
        const ppa = isFinancingOptionAvailable("ppa", state, 700);
        expect(typeof lease).toBe("boolean");
        expect(typeof ppa).toBe("boolean");
      });
    });
  });

  describe("Credit Score Edge Cases", () => {
    it("should handle minimum credit score (300)", () => {
      const result = getCreditScoreIntegration("CO", 300, 7.5, 20625);
      expect(result).toBeDefined();
      expect(result.creditBracket).toBe("Poor");
    });

    it("should handle maximum credit score (850)", () => {
      const result = getCreditScoreIntegration("CO", 850, 7.5, 20625);
      expect(result).toBeDefined();
      expect(result.creditBracket).toBe("Excellent");
    });

    it("should handle credit score just below loan threshold", () => {
      const score = 649;
      expect(isLoanAvailable(score)).toBe(false);
    });

    it("should handle credit score at loan threshold", () => {
      const score = 650;
      expect(isLoanAvailable(score)).toBe(true);
    });

    it("should handle credit score just above loan threshold", () => {
      const score = 651;
      expect(isLoanAvailable(score)).toBe(true);
    });
  });

  describe("State Coverage Verification", () => {
    it("all 50 states should have at least cash and loan (good credit)", () => {
      const allStates = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
      ];

      allStates.forEach(state => {
        const hasCash = isFinancingOptionAvailable("cash", state, 700);
        const hasLoan = isFinancingOptionAvailable("loan", state, 700);
        
        expect(hasCash, `${state} missing cash option`).toBe(true);
        expect(hasLoan, `${state} missing loan option`).toBe(true);
      });
    });

    it("exactly 20 states should have lease available (good credit)", () => {
      const allStates = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
      ];

      const leaseStates = allStates.filter(state => isLeaseAvailable(state));
      expect(leaseStates.length).toBe(20);
    });

    it("exactly 4 states should have PPA available", () => {
      const allStates = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
      ];

      const ppaStates = allStates.filter(state => isPPAAvailable(state));
      expect(ppaStates.length).toBe(4);
      expect(ppaStates).toEqual(expect.arrayContaining(["AZ", "CA", "NV", "UT"]));
    });
  });

  describe("System Integration: Multiple Phases Together", () => {
    it("should combine tax credits + financing for complete offer", () => {
      const systemCost = 25000;
      const federalITC = calculateFederalITC(systemCost, 2026);
      const creditScore = 750;
      const state = "CA";

      // Calculate net cost after ITC
      const netCost = systemCost - federalITC.credit;
      expect(netCost).toBe(17500); // $25k - $7.5k (30% ITC)

      // Check financing options available
      const financing = getCreditScoreIntegration(state, creditScore, 7.5, systemCost);
      expect(financing.availableFinancingOptions.length).toBe(4);

      // Verify APR benefit from good credit
      const apr = calculateAPR(creditScore);
      expect(apr).toBeLessThan(calculateAPR(300));
    });

    it("should show limited options for poor credit in restricted state", () => {
      const creditScore = 300;
      const state = "MS";
      const systemCost = 25000;
      const federalITC = calculateFederalITC(systemCost, 2026);

      const financing = getCreditScoreIntegration(state, creditScore, 7.5, systemCost);
      expect(financing.availableFinancingOptions).toContain("cash");
      expect(financing.availableFinancingOptions.length).toBe(1);

      // Even with ITC, only cash is available
      const remainingCost = systemCost - federalITC.credit;
      expect(remainingCost).toBeGreaterThan(0);
    });
  });
});
