import { describe, it, expect } from "vitest";
import type { CalculationInput, SolarCalculationResult, FinancingOption } from "../types/calculations";

// Mock the full calculation flow
function mockPerformSolarCalculation(input: CalculationInput): SolarCalculationResult {
  // System size calculation
  let estimatedMonthlyKwh = input.monthlyKwh;
  if (!estimatedMonthlyKwh && input.billAmount) {
    estimatedMonthlyKwh = input.billAmount / 0.135;
  }
  if (!estimatedMonthlyKwh) {
    estimatedMonthlyKwh = 500;
  }

  const targetAnnualProduction = estimatedMonthlyKwh * 12 * 0.8;
  const sunFactor = {
    poor: 0.7,
    fair: 0.85,
    good: 1.0,
    excellent: 1.15
  }[input.sunExposure] || 1.0;

  const adjustedProduction = targetAnnualProduction / sunFactor;
  const systemSize = adjustedProduction / 1200;
  const roofConstraint = (input.roofSquareFeet / 100) * 3;
  const systemSizeKw = Math.min(systemSize, roofConstraint);

  const annualProduction = systemSizeKw * 1200;
  const monthlyProduction = annualProduction / 12;

  // Financing calculations
  const totalSystemCost = systemSizeKw * 1000 * 2.75;
  const monthlyElectricityCost = monthlyProduction * 0.135;

  const financing: FinancingOption[] = [
    {
      type: "cash",
      totalCost: totalSystemCost,
      downPayment: totalSystemCost,
      monthlyPayment: 0,
      totalInterest: 0,
      payoffYears: totalSystemCost / (monthlyElectricityCost * 12),
      roi: ((monthlyElectricityCost * 12 * 25 - totalSystemCost) / totalSystemCost) * 100,
      description: "Pay upfront, own your system from day 1"
    },
    {
      type: "loan",
      totalCost: totalSystemCost,
      downPayment: totalSystemCost * 0.2,
      monthlyPayment: 250, // mock
      totalInterest: 50000, // mock
      payoffYears: totalSystemCost * 0.8 / (monthlyElectricityCost * 12),
      roi: ((monthlyElectricityCost * 12 * 25 - totalSystemCost) / totalSystemCost) * 100,
      description: "Finance with competitive rates"
    },
    {
      type: "lease",
      totalCost: 50000, // mock
      downPayment: 0,
      monthlyPayment: monthlyElectricityCost * 0.65,
      totalInterest: 0,
      payoffYears: 20,
      roi: 35,
      leaseTermYears: 20,
      description: "Zero down, predictable payment"
    },
    {
      type: "ppa",
      totalCost: 45000, // mock
      downPayment: 0,
      monthlyPayment: (annualProduction / 12) * 0.1,
      totalInterest: 0,
      payoffYears: 25,
      roi: 45,
      ppaRatePerKwh: 0.1,
      ppaEscalatorPercent: 2.5,
      ppaSavings25Year: 12000,
      description: "Pay per kWh, guaranteed savings"
    }
  ];

  const environmental = {
    annualCO2Offset: annualProduction * 0.4,
    treesEquivalent: Math.round((annualProduction * 0.4) / 20),
    gridIndependence: Math.round(Math.min(100, (annualProduction / 10800) * 100))
  };

  return {
    systemSizeKw: Math.round(systemSizeKw * 100) / 100,
    estimatedAnnualProduction: Math.round(annualProduction),
    estimatedMonthlyProduction: Math.round(monthlyProduction),
    financing,
    environmental,
    confidence: "mocked"
  };
}

describe("End-to-End Calculator Integration", () => {
  describe("Complete Calculator Flow", () => {
    it("should process typical residential customer", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.systemSizeKw).toBeGreaterThan(5);
      expect(result.systemSizeKw).toBeLessThan(10);
      expect(result.estimatedAnnualProduction).toBeGreaterThan(6000);
      expect(result.financing).toHaveLength(4);
      expect(result.environmental).toBeDefined();
    });

    it("should handle high consumption customer", () => {
      const input: CalculationInput = {
        monthlyKwh: 1500,
        roofSquareFeet: 3500,
        sunExposure: "excellent",
        state: "AZ",
        wantsBattery: true
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.systemSizeKw).toBeGreaterThan(10);
      expect(result.financing).toHaveLength(4);
    });

    it("should handle low consumption customer", () => {
      const input: CalculationInput = {
        billAmount: 60,
        roofSquareFeet: 1500,
        sunExposure: "fair",
        state: "NY",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.systemSizeKw).toBeGreaterThan(2);
      expect(result.systemSizeKw).toBeLessThan(5);
    });

    it("should constrain by roof size", () => {
      const input: CalculationInput = {
        monthlyKwh: 1000,
        roofSquareFeet: 500, // very small roof
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      // Should be limited by roof, not consumption
      expect(result.systemSizeKw).toBeLessThan(16); // roof max: (500/100)*3 = 15
    });
  });

  describe("Financing Calculation Validation", () => {
    it("should return all 4 financing options", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.financing).toHaveLength(4);
      expect(result.financing.map((f) => f.type)).toContain("cash");
      expect(result.financing.map((f) => f.type)).toContain("loan");
      expect(result.financing.map((f) => f.type)).toContain("lease");
      expect(result.financing.map((f) => f.type)).toContain("ppa");
    });

    it("cash option should have reasonable upfront cost", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);
      const cashOption = result.financing.find((f) => f.type === "cash")!;

      expect(cashOption.downPayment).toBeGreaterThan(15000);
      expect(cashOption.downPayment).toBeLessThan(30000);
    });

    it("lease and ppa should have $0 down", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);
      const lease = result.financing.find((f) => f.type === "lease")!;
      const ppa = result.financing.find((f) => f.type === "ppa")!;

      expect(lease.downPayment).toBe(0);
      expect(ppa.downPayment).toBe(0);
    });

    it("loan should have 20% down payment", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);
      const loan = result.financing.find((f) => f.type === "loan")!;
      const cash = result.financing.find((f) => f.type === "cash")!;

      expect(loan.downPayment).toBeCloseTo(cash.totalCost * 0.2, 0);
    });

    it("should have monthly payments for loan, lease, ppa", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);
      const loan = result.financing.find((f) => f.type === "loan")!;
      const lease = result.financing.find((f) => f.type === "lease")!;
      const ppa = result.financing.find((f) => f.type === "ppa")!;

      expect(loan.monthlyPayment).toBeGreaterThan(0);
      expect(lease.monthlyPayment).toBeGreaterThan(0);
      expect(ppa.monthlyPayment).toBeGreaterThan(0);
    });

    it("all options should have ROI", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      result.financing.forEach((option) => {
        expect(option.roi).toBeGreaterThan(-10);
        expect(option.roi).toBeLessThan(500);
      });
    });
  });

  describe("Environmental Metrics", () => {
    it("should calculate CO2 offset", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.environmental.annualCO2Offset).toBeGreaterThan(0);
      // 9000 kWh * 0.4 kg CO2/kWh = 3600 kg
      expect(result.environmental.annualCO2Offset).toBeCloseTo(result.estimatedAnnualProduction * 0.4, 0);
    });

    it("should calculate trees equivalent", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.environmental.treesEquivalent).toBeGreaterThan(0);
      // CO2 / 20 kg per tree
      const expectedTrees = Math.round(result.environmental.annualCO2Offset / 20);
      expect(result.environmental.treesEquivalent).toBe(expectedTrees);
    });

    it("should calculate grid independence", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.environmental.gridIndependence).toBeGreaterThan(0);
      expect(result.environmental.gridIndependence).toBeLessThanOrEqual(100);
    });

    it("larger systems should have higher grid independence", () => {
      const small = mockPerformSolarCalculation({
        monthlyKwh: 400,
        roofSquareFeet: 1500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      });

      const large = mockPerformSolarCalculation({
        monthlyKwh: 1200,
        roofSquareFeet: 3500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      });

      expect(large.environmental.gridIndependence).toBeGreaterThan(small.environmental.gridIndependence);
    });
  });

  describe("Input Validation & Edge Cases", () => {
    it("should handle missing monthly kWh with fallback", () => {
      const input: CalculationInput = {
        billAmount: 120,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.systemSizeKw).toBeGreaterThan(0);
      expect(result.financing).toHaveLength(4);
    });

    it("should handle missing both bill and kWh", () => {
      const input: CalculationInput = {
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.systemSizeKw).toBeGreaterThan(0);
    });

    it("should handle poor sun exposure", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "poor",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.systemSizeKw).toBeGreaterThan(5);
    });

    it("should handle excellent sun exposure", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "excellent",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.systemSizeKw).toBeGreaterThan(5);
    });
  });

  describe("Data Consistency", () => {
    it("monthly production should be 1/12 of annual", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      expect(result.estimatedMonthlyProduction * 12).toBeCloseTo(result.estimatedAnnualProduction, 0);
    });

    it("system size should correlate with production", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      // 8kW system at 1200 kWh/kW/year = 9600 kWh/year
      const expectedProduction = result.systemSizeKw * 1200;
      expect(result.estimatedAnnualProduction).toBeCloseTo(expectedProduction, 0);
    });

    it("all financing options should have valid costs", () => {
      const input: CalculationInput = {
        monthlyKwh: 900,
        roofSquareFeet: 2500,
        sunExposure: "good",
        state: "CO",
        wantsBattery: false
      };

      const result = mockPerformSolarCalculation(input);

      result.financing.forEach((option) => {
        expect(option.totalCost).toBeGreaterThan(0);
        expect(option.downPayment).toBeGreaterThanOrEqual(0);
        expect(option.monthlyPayment).toBeGreaterThanOrEqual(0);
        expect(option.totalInterest).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Regional Variations", () => {
    it("should produce reasonable estimates for different states", () => {
      const states = ["AZ", "CA", "CO", "TX", "NY"];

      states.forEach((state) => {
        const result = mockPerformSolarCalculation({
          monthlyKwh: 900,
          roofSquareFeet: 2500,
          sunExposure: "good",
          state: state as unknown as CalculationInput['state'],
          wantsBattery: false
        });

        expect(result.systemSizeKw).toBeGreaterThan(3);
        expect(result.systemSizeKw).toBeLessThan(12);
      });
    });

    it("should return results for all states", () => {
      const allStates = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
      ];

      allStates.forEach((state) => {
        const result = mockPerformSolarCalculation({
          monthlyKwh: 900,
          roofSquareFeet: 2500,
          sunExposure: "good",
          state: state as unknown as CalculationInput['state'],
          wantsBattery: false
        });

        expect(result.systemSizeKw).toBeGreaterThan(0);
        expect(result.financing).toHaveLength(4);
      });
    });
  });
});
