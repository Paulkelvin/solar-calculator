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
 */
export function calculateFinancing(systemSizeKw: number, sunFactor: number = 1.0) {
  const totalSystemCost = systemSizeKw * 1000 * SYSTEM_COST_PER_WATT; // kW * 1000 W/kW * $/W
  // CRITICAL FIX: Apply sunFactor to production so it matches what panels actually produce
  const annualProduction = systemSizeKw * AVG_PRODUCTION_PER_KW * sunFactor;
  const monthlyProduction = annualProduction / 12;
  const monthlyElectricityCost = monthlyProduction * BASE_ELECTRICITY_RATE;

  // === CASH OPTION ===
  const cashMonthlyValue = monthlyElectricityCost;
  // CRITICAL FIX: This was dividing by 12 twice. totalSystemCost / annualSavings = years directly
  const cashPaybackYears = totalSystemCost / (cashMonthlyValue * 12);
  const cashROI25 = ((cashMonthlyValue * 12 * 25 - totalSystemCost) / totalSystemCost) * 100;

  // === LOAN OPTION ===
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
  const loanROI25 = ((cashMonthlyValue * 12 * 25 - loanTotalCost) / loanTotalCost) * 100;

  // === LEASE OPTION ===
  // Typical lease: $0 down, payment at 65% of electricity savings, 20-year term
  const leaseMonthlyPayment = Math.max(50, monthlyElectricityCost * 0.65);
  const leaseTermMonths = 20 * 12;
  const leaseTotalCost = leaseMonthlyPayment * leaseTermMonths;
  const leaseElectricityValue = monthlyElectricityCost * leaseTermMonths;
  const leaseNetSavings = leaseElectricityValue - leaseTotalCost;
  // CRITICAL FIX: Lease break-even = when cumulative net savings > 0
  // Since lease has no upfront cost, break-even is immediate if payment < savings
  const leaseBreakEvenYears = leaseMonthlyPayment < monthlyElectricityCost
    ? 0.1 // effectively immediate (first month you save)
    : (leaseTotalCost / (monthlyElectricityCost * 12)); // years until value = cost
  const leaseROI20 = (leaseNetSavings / leaseTotalCost) * 100;

  // === PPA OPTION ===
  // Power Purchase Agreement: $0 down, pay per kWh generated
  // Typical PPA rate: $0.08-0.12/kWh (lower than grid rate)
  const ppaRatePerKwh = BASE_ELECTRICITY_RATE * 0.75; // 75% of grid rate (~$0.10/kWh)
  const ppaEscalator = 0.025; // 2.5% annual escalation
  const ppaTermYears = 25;

  // Calculate 25-year PPA cost with escalation
  let ppaTotalCost = 0;
  let ppaElectricityValue = 0;
  for (let year = 0; year < ppaTermYears; year++) {
    const escalatedRate = ppaRatePerKwh * Math.pow(1 + ppaEscalator, year);
    ppaTotalCost += annualProduction * escalatedRate;
    // Assume grid rate also escalates at same rate for comparison
    ppaElectricityValue += annualProduction * (BASE_ELECTRICITY_RATE * Math.pow(1 + ppaEscalator, year));
  }
  const ppaSavings25Year = ppaElectricityValue - ppaTotalCost;
  const ppaMonthlyPayment = (annualProduction / 12) * ppaRatePerKwh; // avg first year
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
      yearsToBreakEven: (() => {
        // Find year where cumulative savings exceed cumulative loan costs
        let cumulativeSavings = 0;
        let cumulativeCosts = loanDownPayment;
        for (let month = 1; month <= numPayments; month++) {
          cumulativeSavings += cashMonthlyValue;
          cumulativeCosts += loanMonthlyPayment;
          if (cumulativeSavings >= cumulativeCosts) return month / 12;
        }
        // After loan term, only savings accumulate
        const remaining = cumulativeCosts - cumulativeSavings;
        return LOAN_TERM_YEARS + remaining / (cashMonthlyValue * 12);
      })(),
      roi25Years: loanROI25
    },
    lease: {
      downPayment: 0,
      monthlyPayment: leaseMonthlyPayment,
      termYears: 20,
      totalCost: leaseTotalCost,
      yearsToBreakEven: leaseBreakEvenYears,
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
  annualProduction: number
) {
  // CO2 offset: avg US grid ~0.4 kg CO2 per kWh
  const co2PerKwh = 0.4;
  const annualCO2Offset = annualProduction * co2PerKwh;

  // Trees: mature tree absorbs ~20 kg CO2/year
  const treesEquivalent = annualCO2Offset / 20;

  // Grid independence: % of typical home consumption covered by solar
  const typicalHomeConsumption = 10800; // kWh/year US average
  const gridIndependence = Math.min(100, (annualProduction / typicalHomeConsumption) * 100);

  return {
    annualCO2Offset,
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

  const environmental = calculateEnvironmental(systemSizeKw, annualProduction);

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
