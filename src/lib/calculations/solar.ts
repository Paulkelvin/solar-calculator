import type { CalculationInput, SolarCalculationResult } from "../../../types/calculations";

// === CENTRAL CONSTANTS ===
// All financial calculations should use these values
export const SYSTEM_COST_PER_WATT = 2.75;
export const AVG_PRODUCTION_PER_KW = 1200; // kWh/year, regional adjustment possible
export const LOAN_INTEREST_RATE = 0.065;
export const LOAN_TERM_YEARS = 25;
export const BASE_ELECTRICITY_RATE = 0.14; // $/kWh US average
export const RATE_ESCALATION = 0.025; // 2.5% annual electricity rate increase
export const PANEL_DEGRADATION = 0.005; // 0.5% per year
export const FIXED_INSTALL_OVERHEAD = 5000; // permits, engineering, monitoring, interconnection

/**
 * Calculate system size based on usage and roof constraints.
 * Mock logic: estimate from monthly consumption or bill.
 */
export function calculateSystemSize(input: CalculationInput): number {
  let estimatedMonthlyKwh = input.monthlyKwh;

  if (!estimatedMonthlyKwh && input.billAmount) {
    // Convert bill amount to kWh using our standard rate
    estimatedMonthlyKwh = input.billAmount / BASE_ELECTRICITY_RATE;
  }

  if (!estimatedMonthlyKwh) {
    estimatedMonthlyKwh = 500; // fallback mock
  }

  // Assume 80% offset of consumption (Phase 1 mock)
  const targetAnnualProduction = estimatedMonthlyKwh * 12 * 0.8;

  // Adjust for sun exposure (simple factor)
  const sunFactor = {
    poor: 0.7,
    fair: 0.85,
    good: 1.0,
    excellent: 1.15
  }[input.sunExposure] || 1.0;

  const adjustedProduction = targetAnnualProduction / sunFactor;

  // System size = adjustedProduction / average annual kWh per kW
  const systemSize = adjustedProduction / AVG_PRODUCTION_PER_KW;

  // Constrain by roof size (~54 sq ft per kW of panels, ~60% usable roof area)
  const roofConstraint = (input.roofSquareFeet * 0.6) / 54;

  return Math.min(systemSize, roofConstraint);
}

/**
 * Phase 3.4: Expanded financing calculation for 4 options:
 * Cash, Loan, Lease (with $0 down), and PPA (power purchase agreement).
 *
 * ALL payback and ROI calculations now include:
 *   - 2.5%/yr utility rate escalation  (RATE_ESCALATION)
 *   - 0.5%/yr linear panel degradation (PANEL_DEGRADATION)
 * This matches the 25-Year Savings Trajectory chart exactly.
 */
export function calculateFinancing(systemSizeKw: number, sunFactor: number = 1.0) {
  const totalSystemCost = FIXED_INSTALL_OVERHEAD + systemSizeKw * 1000 * SYSTEM_COST_PER_WATT;
  const annualProduction = systemSizeKw * AVG_PRODUCTION_PER_KW * sunFactor;
  const monthlyProduction = annualProduction / 12;
  const monthlyElectricityCost = monthlyProduction * BASE_ELECTRICITY_RATE;
  const baseAnnualSavings = monthlyElectricityCost * 12; // year-1 savings before escalation

  // --- Helper: year-N savings with escalation + linear degradation ---
  // Matches CashFlowChart: escalation = (1 + 2.5%)^year, degradation = 1 - year*0.5%
  function savingsForYear(year: number): number {
    const escalation = Math.pow(1 + RATE_ESCALATION, year);
    const degradation = Math.max(0, 1 - year * PANEL_DEGRADATION);
    return baseAnnualSavings * escalation * degradation;
  }

  // --- 25-year cumulative savings ---
  let total25YrSavings = 0;
  for (let y = 1; y <= 25; y++) total25YrSavings += savingsForYear(y);

  // === CASH ===
  const cashPaybackYears = (() => {
    let cum = 0;
    for (let y = 1; y <= 25; y++) {
      const ys = savingsForYear(y);
      cum += ys;
      if (cum >= totalSystemCost) {
        const prev = cum - ys;
        return (y - 1) + (totalSystemCost - prev) / ys;
      }
    }
    return 25;
  })();
  const cashROI25 = ((total25YrSavings - totalSystemCost) / totalSystemCost) * 100;

  // === LOAN ===
  // 10% down, 6.5% APR, 25-year term
  const loanDownPayment = totalSystemCost * 0.10;
  const loanPrincipal = totalSystemCost - loanDownPayment;
  const monthlyRate = LOAN_INTEREST_RATE / 12;
  const numPayments = LOAN_TERM_YEARS * 12;
  const loanMonthlyPayment =
    loanPrincipal *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  const loanTotalInterest = loanMonthlyPayment * numPayments - loanPrincipal;
  const loanTotalCost = loanDownPayment + loanMonthlyPayment * numPayments;
  const loanROI25 = ((total25YrSavings - loanTotalCost) / loanTotalCost) * 100;

  const loanBreakEven = (() => {
    let cum = -loanDownPayment;
    for (let y = 1; y <= 25; y++) {
      const ys = savingsForYear(y);
      const loanYearPayment = y <= LOAN_TERM_YEARS ? loanMonthlyPayment * 12 : 0;
      const net = ys - loanYearPayment;
      cum += net;
      if (cum >= 0) {
        const prev = cum - net;
        return net > 0 ? (y - 1) + (-prev) / net : y;
      }
    }
    // Still negative at year 25 — extrapolate
    if (cum < 0) return 25 + (-cum) / savingsForYear(25);
    return 25;
  })();

  // === LEASE ===
  const leaseMonthlyPayment = Math.max(50, monthlyElectricityCost * 0.65);
  const leaseTerm = 20;

  let leaseTotalSavings = 0;
  const leaseTotalPayments = leaseMonthlyPayment * 12 * leaseTerm;
  for (let y = 1; y <= leaseTerm; y++) leaseTotalSavings += savingsForYear(y);
  const leaseNetSavings = leaseTotalSavings - leaseTotalPayments;
  const leaseROI20 = (leaseNetSavings / leaseTotalPayments) * 100;

  const leaseBreakEven = (() => {
    // If monthly payment < month-1 savings → immediate break even
    if (leaseMonthlyPayment < monthlyElectricityCost) return 0.1;
    let cum = 0;
    for (let y = 1; y <= leaseTerm; y++) {
      const net = savingsForYear(y) - leaseMonthlyPayment * 12;
      cum += net;
      if (cum >= 0) {
        const prev = cum - net;
        return net > 0 ? (y - 1) + (-prev) / net : y;
      }
    }
    return leaseTerm;
  })();

  // === PPA ===
  const ppaRatePerKwh = BASE_ELECTRICITY_RATE * 0.75;
  const ppaEscalator = 0.025;
  const ppaTermYears = 25;

  let ppaTotalCost = 0;
  let ppaElectricityValue = 0;
  for (let year = 0; year < ppaTermYears; year++) {
    const yearProd = annualProduction * Math.max(0, 1 - (year + 1) * PANEL_DEGRADATION);
    const escalatedRate = ppaRatePerKwh * Math.pow(1 + ppaEscalator, year);
    ppaTotalCost += yearProd * escalatedRate;
    ppaElectricityValue += yearProd * (BASE_ELECTRICITY_RATE * Math.pow(1 + RATE_ESCALATION, year));
  }
  const ppaSavings25Year = ppaElectricityValue - ppaTotalCost;
  const ppaMonthlyPayment = (annualProduction / 12) * ppaRatePerKwh;
  const ppaROI25 = (ppaSavings25Year / ppaTotalCost) * 100;

  return {
    totalSystemCost,
    cash: {
      upfront: totalSystemCost,
      monthly: 0,
      yearsToBreakEven: cashPaybackYears,
      roi25Years: cashROI25
    },
    loan: {
      downPayment: loanDownPayment,
      monthlyPayment: loanMonthlyPayment,
      totalInterest: loanTotalInterest,
      yearsToBreakEven: loanBreakEven,
      roi25Years: loanROI25
    },
    lease: {
      downPayment: 0,
      monthlyPayment: leaseMonthlyPayment,
      termYears: leaseTerm,
      totalCost: leaseTotalPayments,
      yearsToBreakEven: leaseBreakEven,
      roi20Years: leaseROI20
    },
    ppa: {
      downPayment: 0,
      monthlyPayment: ppaMonthlyPayment,
      ratePerKwh: ppaRatePerKwh,
      escalator: ppaEscalator,
      totalCost: ppaTotalCost,
      savings25Year: ppaSavings25Year,
      roi25Years: ppaROI25
    }
  };
}

/**
 * Mock environmental metrics calculation.
 */
export function calculateEnvironmental(
  systemSizeKw: number,
  annualProduction: number,
  annualConsumption?: number
) {
  // CO2 offset: avg US grid ~0.4 kg CO2 per kWh
  const co2PerKwh = 0.4;
  const annualCO2Offset = annualProduction * co2PerKwh;

  // Trees: mature tree absorbs ~20 kg CO2/year
  const treesEquivalent = annualCO2Offset / 20;

  // Grid independence: % of actual household consumption covered by solar
  // Use actual consumption when available; fall back to US average (10,800 kWh/yr)
  const effectiveConsumption = annualConsumption && annualConsumption > 0 ? annualConsumption : 10800;
  const gridIndependence = Math.min(100, (annualProduction / effectiveConsumption) * 100);

  return {
    annualCO2Offset: Math.round(annualCO2Offset),
    treesEquivalent: Math.round(treesEquivalent),
    gridIndependence: Math.round(gridIndependence)
  };
}

/**
 * Main orchestrator for solar calculation. Returns Phase 1 mock results.
 */
export function performSolarCalculation(
  input: CalculationInput
): SolarCalculationResult {
  const systemSizeKw = calculateSystemSize(input);
  
  // Get sun factor for this input
  const sunFactor = {
    poor: 0.7,
    fair: 0.85,
    good: 1.0,
    excellent: 1.15
  }[input.sunExposure] || 1.0;

  // Apply sunFactor to production (matches calculateSystemSize logic)
  const annualProduction = systemSizeKw * AVG_PRODUCTION_PER_KW * sunFactor;
  const monthlyProduction = annualProduction / 12;

  const financingData = calculateFinancing(systemSizeKw, sunFactor);

  const financing = [
    {
      type: "cash" as const,
      totalCost: financingData.totalSystemCost,
      downPayment: financingData.totalSystemCost,
      monthlyPayment: 0,
      totalInterest: 0,
      payoffYears: financingData.cash.yearsToBreakEven,
      roi: financingData.cash.roi25Years,
      description: "Pay upfront, own your system from day 1"
    },
    {
      type: "loan" as const,
      totalCost: financingData.totalSystemCost,
      downPayment: financingData.loan.downPayment,
      monthlyPayment: financingData.loan.monthlyPayment,
      totalInterest: financingData.loan.totalInterest,
      payoffYears: financingData.loan.yearsToBreakEven,
      roi: financingData.loan.roi25Years,
      description: "Finance with competitive rates, own after payoff"
    },
    {
      type: "lease" as const,
      totalCost: financingData.lease.totalCost,
      downPayment: 0,
      monthlyPayment: financingData.lease.monthlyPayment,
      totalInterest: 0,
      payoffYears: financingData.lease.yearsToBreakEven,
      roi: financingData.lease.roi20Years,
      leaseDownPayment: 0,
      leaseMonthlyPayment: financingData.lease.monthlyPayment,
      leaseTermYears: financingData.lease.termYears,
      description: "Zero down, predictable monthly payment"
    },
    {
      type: "ppa" as const,
      totalCost: financingData.ppa.totalCost,
      downPayment: 0,
      monthlyPayment: financingData.ppa.monthlyPayment,
      totalInterest: 0,
      payoffYears: 25, // PPA term
      roi: financingData.ppa.roi25Years,
      ppaRatePerKwh: financingData.ppa.ratePerKwh,
      ppaEscalatorPercent: financingData.ppa.escalator * 100,
      ppaSavings25Year: financingData.ppa.savings25Year,
      description: "Pay for power produced, guaranteed savings"
    }
  ];

  // Derive actual annual consumption for environmental metrics
  let annualConsumption: number | undefined;
  if (input.monthlyKwh) {
    annualConsumption = input.monthlyKwh * 12;
  } else if (input.billAmount) {
    annualConsumption = (input.billAmount / BASE_ELECTRICITY_RATE) * 12;
  }

  const environmental = calculateEnvironmental(systemSizeKw, annualProduction, annualConsumption);

  return {
    systemSizeKw: Math.round(systemSizeKw * 100) / 100,
    estimatedAnnualProduction: Math.round(annualProduction),
    estimatedMonthlyProduction: Math.round(monthlyProduction),
    financing,
    environmental,
    confidence: "preliminary"
  };
}

/**
 * Stub lead scoring: simple formula based on system size and preferences.
 */
export function calculateLeadScore(
  systemSizeKw: number,
  financingType: string,
  timeline: string
): number {
  let score = 50; // base

  // Larger systems = higher interest
  if (systemSizeKw > 8) score += 20;
  else if (systemSizeKw > 5) score += 10;

  // Immediate or short timeline = higher score
  if (timeline === "immediate") score += 15;
  else if (timeline === "3-months") score += 10;

  // Cash financing = higher score (easier sale)
  if (financingType === "cash") score += 10;

  return Math.min(100, score);
}
