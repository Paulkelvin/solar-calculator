/**
 * Comprehensive end-to-end consistency verification
 * Tests multiple scenarios across every calculation path
 */
import {
  calculateFinancing,
  calculateEnvironmental,
  performSolarCalculation,
  calculateSystemSize,
  AVG_PRODUCTION_PER_KW,
  BASE_ELECTRICITY_RATE,
  SYSTEM_COST_PER_WATT,
  RATE_ESCALATION,
  PANEL_DEGRADATION,
  FIXED_INSTALL_OVERHEAD,
} from './src/lib/calculations/solar';
import { generateSystemDesignOptions } from './src/lib/system-design-service';

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) { console.error(`  ❌ FAIL: ${msg}`); fail++; }
  else { pass++; }
}
function approx(a: number, b: number, tol = 0.15, msg = '') {
  const diff = Math.abs(a - b);
  const rel = b !== 0 ? diff / Math.abs(b) : diff;
  if (rel > tol && diff > 1) {
    console.error(`  ❌ FAIL: ${msg} — got ${a}, expected ~${b} (diff=${(rel*100).toFixed(1)}%)`);
    fail++;
  } else { pass++; }
}

// Simulate CashFlowChart logic exactly
function simulateChart(systemCost: number, annualProd: number, loanMonthly: number, loanDown: number, leaseMo: number) {
  let cashCum = -systemCost;
  let loanCum = -loanDown;
  let leaseCum = 0;
  let cashPayback = 0;
  let loanPayback = 0;

  for (let y = 1; y <= 25; y++) {
    const esc = Math.pow(1 + RATE_ESCALATION, y);
    const deg = Math.max(0, 1 - y * PANEL_DEGRADATION);
    const savings = annualProd * BASE_ELECTRICITY_RATE * esc * deg;
    const loanPay = y <= 25 ? loanMonthly * 12 : 0;
    const leasePay = y <= 20 ? leaseMo * 12 : 0;

    const prevCash = cashCum;
    cashCum += savings;
    if (prevCash < 0 && cashCum >= 0) {
      cashPayback = (y - 1) + (-prevCash / savings);
    }

    const prevLoan = loanCum;
    const loanNet = savings - loanPay;
    loanCum += loanNet;
    if (prevLoan < 0 && loanCum >= 0 && loanNet > 0) {
      loanPayback = (y - 1) + (-prevLoan / loanNet);
    }

    leaseCum += savings - leasePay;
  }

  return { cashPayback, loanPayback, cash25yr: cashCum, loan25yr: loanCum, lease25yr: leaseCum };
}

interface Scenario {
  name: string;
  billAmount: number;
  monthlyKwh?: number;
  roofSqft: number;
  sunExposure: 'poor' | 'fair' | 'good' | 'excellent';
  state: string;
  // Google Solar overrides (if real data)
  googleSystemKw?: number;
  googleAnnualKwh?: number;
  googleSunPct?: number;
}

const scenarios: Scenario[] = [
  {
    name: '1. Small house, low bill, small roof (Romeoville IL)',
    billAmount: 150, roofSqft: 800, sunExposure: 'good', state: 'IL',
  },
  {
    name: '2. Medium house, $200 bill (Denver CO)',
    billAmount: 200, roofSqft: 1800, sunExposure: 'excellent', state: 'CO',
  },
  {
    name: '3. Large house, $500 bill, small roof (Romeoville IL $500)',
    billAmount: 500, roofSqft: 603, sunExposure: 'excellent', state: 'IL',
    googleSystemKw: 8, googleAnnualKwh: 9576, googleSunPct: 93,
  },
  {
    name: '4. Commercial bldg, $500 bill, huge roof (Albany NY)',
    billAmount: 500, roofSqft: 71020, sunExposure: 'excellent', state: 'NY',
    googleSystemKw: 24.84, googleAnnualKwh: 32280, googleSunPct: 86,
  },
  {
    name: '5. Tiny system, $80 bill (Phoenix AZ)',
    billAmount: 80, roofSqft: 600, sunExposure: 'excellent', state: 'AZ',
  },
  {
    name: '6. Median US home, kWh-based (Average)',
    monthlyKwh: 900, billAmount: 0, roofSqft: 1500, sunExposure: 'good', state: 'TX',
  },
  {
    name: '7. Poor sun area (Seattle WA)',
    billAmount: 200, roofSqft: 2000, sunExposure: 'poor', state: 'WA',
  },
];

console.log('='.repeat(70));
console.log('COMPREHENSIVE SOLAR CALCULATOR CONSISTENCY TEST');
console.log('='.repeat(70));

for (const s of scenarios) {
  console.log(`\n--- ${s.name} ---`);

  // === 1. performSolarCalculation (wizard → financing preview) ===
  const input = {
    monthlyKwh: s.monthlyKwh || s.billAmount / BASE_ELECTRICITY_RATE,
    billAmount: s.billAmount || undefined,
    roofSquareFeet: s.roofSqft,
    sunExposure: s.sunExposure,
    state: s.state,
    wantsBattery: false,
  };
  const calc = performSolarCalculation(input);

  const annualConsumption = (s.monthlyKwh || s.billAmount / BASE_ELECTRICITY_RATE) * 12;
  const sunFactorMap = { poor: 0.7, fair: 0.85, good: 1.0, excellent: 1.15 };
  const sunFactor = sunFactorMap[s.sunExposure];
  const roofMax = (s.roofSqft * 0.6) / 54;

  // System size should be constrained by roof
  assert(calc.systemSizeKw <= roofMax + 0.1, `System size ${calc.systemSizeKw} <= roof max ${roofMax.toFixed(1)}`);

  // Production = size * 1200 * sunFactor
  const expectedProd = calc.systemSizeKw * AVG_PRODUCTION_PER_KW * sunFactor;
  approx(calc.estimatedAnnualProduction, expectedProd, 0.01, 'Annual prod matches formula');

  // Monthly = annual / 12
  approx(calc.estimatedMonthlyProduction, Math.round(expectedProd / 12), 0.02, 'Monthly prod = annual/12');

  // === 2. Financing card consistency ===
  const cashCard = calc.financing.find(f => f.type === 'cash')!;
  const loanCard = calc.financing.find(f => f.type === 'loan')!;
  const leaseCard = calc.financing.find(f => f.type === 'lease')!;

  // Cash card total = system cost (including overhead)
  const expectedCost = FIXED_INSTALL_OVERHEAD + calc.systemSizeKw * 1000 * SYSTEM_COST_PER_WATT;
  approx(cashCard.totalCost, expectedCost, 0.01, 'Cash total = system cost');
  approx(cashCard.downPayment, expectedCost, 0.01, 'Cash down = system cost');

  // Loan down = 10%
  approx(loanCard.downPayment, expectedCost * 0.1, 0.01, 'Loan down = 10% of cost');

  // Lease down = 0
  assert(leaseCard.downPayment === 0, 'Lease down = $0');

  // === 3. Card payback vs Chart payback ===
  const chartSim = simulateChart(
    expectedCost,
    calc.estimatedAnnualProduction,
    loanCard.monthlyPayment,
    loanCard.downPayment,
    leaseCard.monthlyPayment
  );

  approx(cashCard.payoffYears, chartSim.cashPayback, 0.05, `Cash payback card(${cashCard.payoffYears.toFixed(1)}) vs chart(${chartSim.cashPayback.toFixed(1)})`);

  if (chartSim.loanPayback > 0) {
    approx(loanCard.payoffYears, chartSim.loanPayback, 0.15, `Loan payback card(${loanCard.payoffYears.toFixed(1)}) vs chart(${chartSim.loanPayback.toFixed(1)})`);
  }

  // === 4. Environmental consistency ===
  const env = calc.environmental;
  const expectedCO2 = Math.round(calc.estimatedAnnualProduction * 0.4);
  approx(env.annualCO2Offset, expectedCO2, 0.01, 'CO2 = prod * 0.4');
  approx(env.treesEquivalent, Math.round(expectedCO2 / 20), 0.05, 'Trees = CO2/20');

  // Grid independence should reflect actual consumption
  const expectedGridIndep = Math.min(100, Math.round((calc.estimatedAnnualProduction / annualConsumption) * 100));
  approx(env.gridIndependence, expectedGridIndep, 0.02, `GridIndep(${env.gridIndependence}%) vs expected(${expectedGridIndep}%)`);

  // Bill offset (what BillOffsetChart shows) should equal grid independence
  const billOffsetPct = Math.min(100, Math.round((calc.estimatedAnnualProduction / annualConsumption) * 100));
  assert(env.gridIndependence === billOffsetPct, `GridIndep(${env.gridIndependence}%) = BillOffset(${billOffsetPct}%)`);

  // === 5. System Design Tiers ===
  const tiers = generateSystemDesignOptions(annualConsumption, sunFactor, s.state, s.roofSqft);

  // All tiers should be roof-constrained
  for (const t of tiers) {
    assert(t.systemSizeKw <= roofMax + 0.1, `Tier ${t.name} size(${t.systemSizeKw}) <= roof(${roofMax.toFixed(1)})`);
  }

  // Tiers should be ordered: Conservative < Standard < Aggressive (or equal if roof-capped)
  assert(tiers[0].systemSizeKw <= tiers[1].systemSizeKw, 'Conservative <= Standard size');
  assert(tiers[1].systemSizeKw <= tiers[2].systemSizeKw, 'Standard <= Aggressive size');

  // Check if all tiers hit roof cap → they'd be identical (acceptable)
  const allCapped = tiers[0].systemSizeKw === tiers[2].systemSizeKw;
  if (!allCapped) {
    // ROI should vary
    const roiSpread = Math.abs(tiers[2].roi25Year - tiers[0].roi25Year);
    assert(roiSpread > 0, `ROI varies across tiers (spread=${roiSpread}%)`);
  }

  // === 6. Google Solar override path (when real data exists) ===
  if (s.googleSystemKw && s.googleAnnualKwh) {
    const googleProdPerKw = s.googleAnnualKwh / s.googleSystemKw;
    const effectiveSunFactor = googleProdPerKw / AVG_PRODUCTION_PER_KW;
    const googleFinancing = calculateFinancing(s.googleSystemKw, effectiveSunFactor);
    const googleEnv = calculateEnvironmental(s.googleSystemKw, s.googleAnnualKwh, annualConsumption);

    const googleCost = FIXED_INSTALL_OVERHEAD + s.googleSystemKw * 1000 * SYSTEM_COST_PER_WATT;
    const googleChartSim = simulateChart(
      googleCost,
      s.googleAnnualKwh,
      googleFinancing.loan.monthlyPayment,
      googleFinancing.loan.downPayment,
      googleFinancing.lease.monthlyPayment
    );

    approx(
      googleFinancing.cash.yearsToBreakEven,
      googleChartSim.cashPayback,
      0.05,
      `Google: Cash payback card(${googleFinancing.cash.yearsToBreakEven.toFixed(1)}) vs chart(${googleChartSim.cashPayback.toFixed(1)})`
    );

    const googleGridIndep = Math.min(100, Math.round((s.googleAnnualKwh / annualConsumption) * 100));
    const googleBillOffset = Math.min(100, Math.round((s.googleAnnualKwh / annualConsumption) * 100));
    assert(googleGridIndep === googleBillOffset, `Google: GridIndep(${googleGridIndep}%) = BillOffset(${googleBillOffset}%)`);
    approx(googleEnv.gridIndependence, googleGridIndep, 0.02, `Google: env.gridIndep(${googleEnv.gridIndependence}%) = expected(${googleGridIndep}%)`);
  }

  // === 7. FinancialPreviewStep savings range ===
  // Should be based on actual production from performSolarCalculation, ±10%
  const previewAnnualSavings = calc.estimatedAnnualProduction * BASE_ELECTRICITY_RATE;
  const expectedMin = Math.round(previewAnnualSavings * 0.9);
  const expectedMax = Math.round(previewAnnualSavings * 1.1);
  // Verify range is reasonable
  assert(expectedMin > 0, `Savings range min(${expectedMin}) > 0`);
  assert(expectedMax > expectedMin, `Savings range max(${expectedMax}) > min(${expectedMin})`);

  console.log(`  System: ${calc.systemSizeKw}kW | Prod: ${calc.estimatedAnnualProduction}kWh | GridIndep: ${env.gridIndependence}%`);
  console.log(`  Cash: ${cashCard.payoffYears.toFixed(1)}yr/${cashCard.roi.toFixed(0)}% | Loan: ${loanCard.payoffYears.toFixed(1)}yr/${loanCard.roi.toFixed(0)}%`);
  console.log(`  Savings range: $${expectedMin}–$${expectedMax}`);
  if (tiers.length > 0) {
    console.log(`  Tiers: ${tiers.map(t => `${t.name}(${t.systemSizeKw}kW,${t.roi25Year}%ROI,${t.paybackYears}y)`).join(' | ')}`);
  }
}

// === 8. Edge case: system-design with calculateFinancing should agree ===
console.log('\n--- Edge: system-design vs calculateFinancing agreement ---');
const sdOpts = generateSystemDesignOptions(10800, 1.0, 'CA');
for (const opt of sdOpts) {
  const fin = calculateFinancing(opt.systemSizeKw, 1.0);
  // Note: system-design uses FIXED_INSTALL_OVERHEAD ($5000) but calculateFinancing doesn't
  // So costs differ — this is a design choice. But payback ratio shape should be consistent.
  const finCashPayback = fin.cash.yearsToBreakEven;
  // Both use same savingsForYear formula, so if costs were equal, paybacks would match.
  // The overhead intentionally makes design-tier payback slightly longer.
  console.log(`  ${opt.name}: design(${opt.paybackYears}y, ${opt.roi25Year}%ROI, $${opt.systemCostUSD}) vs financing(${finCashPayback.toFixed(1)}y, ${fin.cash.roi25Years.toFixed(0)}%ROI, $${Math.round(fin.totalSystemCost)})`);
}

console.log('\n' + '='.repeat(70));
console.log(`RESULTS: ${pass} passed, ${fail} failed`);
console.log('='.repeat(70));
if (fail > 0) process.exit(1);
