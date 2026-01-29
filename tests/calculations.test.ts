import { describe, it, expect } from "vitest";
import {
  calculateSystemSize,
  calculateFinancing,
  calculateEnvironmental,
  performSolarCalculation,
  calculateLeadScore
} from "../src/lib/calculations/solar";
import type { CalculationInput } from "../types/calculations";

describe("Solar Calculations", () => {
  describe("calculateSystemSize", () => {
    it("should calculate system size from monthly bill", () => {
      const input: CalculationInput = {
        billAmount: 120,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };
      const size = calculateSystemSize(input);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(20); // reasonable range
    });

    it("should calculate system size from monthly kWh", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };
      const size = calculateSystemSize(input);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(20);
    });

    it("should apply sun exposure adjustment", () => {
      const baseInput: CalculationInput = {
        billAmount: 120,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const poorSun = calculateSystemSize({
        ...baseInput,
        sunExposure: "poor"
      });

      const excellentSun = calculateSystemSize({
        ...baseInput,
        sunExposure: "excellent"
      });

      // Poor sun requires larger system, excellent sun requires smaller
      expect(poorSun).toBeGreaterThan(excellentSun);
    });

    it("should constrain by roof size", () => {
      const input: CalculationInput = {
        billAmount: 120,
        roofSquareFeet: 100, // small roof
        sunExposure: "excellent",
        state: "CO",
        wantsBattery: false
      };
      const size = calculateSystemSize(input);
      expect(size).toBeLessThan(5); // constrained by roof
    });
  });

  describe("calculateFinancing", () => {
    it("should return valid financing structure with 4 options", () => {
      const financing = calculateFinancing(8);

      expect(financing.totalSystemCost).toBeGreaterThan(0);
      expect(financing.cash).toBeDefined();
      expect(financing.loan).toBeDefined();
      expect(financing.lease).toBeDefined();
      expect(financing.ppa).toBeDefined();
      expect(financing.cash.yearsToBreakEven).toBeGreaterThan(0);
      expect(financing.loan.yearsToBreakEven).toBeGreaterThan(0);
    });

    it("should calculate loan interest correctly", () => {
      const financing = calculateFinancing(8);

      expect(financing.loan.monthlyPayment).toBeGreaterThan(0);
      expect(financing.loan.totalInterest).toBeGreaterThan(0);
      expect(financing.loan.downPayment).toBe(financing.totalSystemCost * 0.2);
    });

    it("should calculate lease with zero down payment", () => {
      const financing = calculateFinancing(8);

      expect(financing.lease.downPayment).toBe(0);
      expect(financing.lease.monthlyPayment).toBeGreaterThan(0);
      expect(financing.lease.termYears).toBe(20);
    });

    it("should calculate PPA with escalator", () => {
      const financing = calculateFinancing(8);

      expect(financing.ppa.downPayment).toBe(0);
      expect(financing.ppa.monthlyPayment).toBeGreaterThan(0);
      expect(financing.ppa.ratePerKwh).toBeGreaterThan(0);
      expect(financing.ppa.escalator).toBeGreaterThan(0);
      expect(financing.ppa.savings25Year).toBeGreaterThan(0);
    });

    it("should calculate ROI for all financing types", () => {
      const financing = calculateFinancing(8);

      expect(financing.cash.roi25Years).toBeGreaterThan(-50);
      expect(financing.loan.roi25Years).toBeGreaterThan(-50);
      expect(financing.lease.roi20Years).toBeDefined();
      expect(financing.ppa.roi25Years).toBeGreaterThan(0);
    });
  });

  describe("calculateEnvironmental", () => {
    it("should calculate environmental metrics", () => {
      const env = calculateEnvironmental(8, 9600);

      expect(env.annualCO2Offset).toBeGreaterThan(0);
      expect(env.treesEquivalent).toBeGreaterThan(0);
      expect(env.gridIndependence).toBeGreaterThan(0);
      expect(env.gridIndependence).toBeLessThanOrEqual(100);
    });

    it("should scale CO2 offset with production", () => {
      const env1 = calculateEnvironmental(5, 6000);
      const env2 = calculateEnvironmental(10, 12000);

      expect(env2.annualCO2Offset).toBeGreaterThan(env1.annualCO2Offset);
    });
  });

  describe("performSolarCalculation", () => {
    it("should return complete calculation result", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = performSolarCalculation(input);

      expect(result.systemSizeKw).toBeGreaterThan(0);
      expect(result.estimatedAnnualProduction).toBeGreaterThan(0);
      expect(result.estimatedMonthlyProduction).toBeGreaterThan(0);
      expect(result.financing).toHaveLength(4);
      expect(result.environmental).toBeDefined();
      expect(result.confidence).toBe("mocked");
    });

    it("should have 4 financing cards (cash, loan, lease, ppa)", () => {
      const input: CalculationInput = {
        billAmount: 120,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = performSolarCalculation(input);

      expect(result.financing).toHaveLength(4);
      expect(result.financing[0].type).toBe("cash");
      expect(result.financing[1].type).toBe("loan");
      expect(result.financing[2].type).toBe("lease");
      expect(result.financing[3].type).toBe("ppa");
    });

    it("should return realistic system size", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: true
      };

      const result = performSolarCalculation(input);

      // Typical homes: 5-10 kW systems
      expect(result.systemSizeKw).toBeGreaterThan(3);
      expect(result.systemSizeKw).toBeLessThan(15);
    });
  });

  describe("calculateLeadScore", () => {
    it("should return score between 0-100", () => {
      const score = calculateLeadScore(8, "cash", "immediate");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should reward larger systems", () => {
      const smallScore = calculateLeadScore(3, "cash", "6-months");
      const largeScore = calculateLeadScore(10, "cash", "6-months");

      expect(largeScore).toBeGreaterThan(smallScore);
    });

    it("should reward immediate timeline", () => {
      const immediateScore = calculateLeadScore(8, "cash", "immediate");
      const laterScore = calculateLeadScore(8, "cash", "12-months");

      expect(immediateScore).toBeGreaterThan(laterScore);
    });

    it("should reward cash financing", () => {
      const cashScore = calculateLeadScore(8, "cash", "6-months");
      const loanScore = calculateLeadScore(8, "loan", "6-months");

      expect(cashScore).toBeGreaterThanOrEqual(loanScore);
    });
  });
});
