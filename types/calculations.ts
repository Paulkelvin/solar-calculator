export interface FinancingOption {
  type: "cash" | "loan" | "lease" | "ppa";
  totalCost: number; // Total cost or total savings over term
  downPayment: number; // 0 for lease/PPA
  monthlyPayment: number;
  totalInterest: number; // For loan; 0 for others
  payoffYears: number; // Break-even years
  roi: number; // 25-year ROI %
  description?: string; // Short explanation
  
  // Lease-specific
  leaseDownPayment?: number;
  leaseMonthlyPayment?: number;
  leaseTermYears?: number;
  
  // PPA-specific
  ppaRatePerKwh?: number;
  ppaEscalatorPercent?: number;
  ppaSavings25Year?: number;
}

export interface EnvironmentalMetrics {
  annualCO2Offset: number; // kg
  treesEquivalent: number;
  gridIndependence: number; // %
}

export interface SolarCalculationResult {
  systemSizeKw: number;
  estimatedAnnualProduction: number; // kWh
  estimatedMonthlyProduction: number; // kWh
  financing: FinancingOption[];
  environmental: EnvironmentalMetrics;
  confidence: "mocked" | "preliminary" | "validated";
}

export interface CalculationInput {
  monthlyKwh?: number;
  billAmount?: number;
  roofSquareFeet: number;
  sunExposure: "poor" | "fair" | "good" | "excellent";
  state: string;
  wantsBattery: boolean;
}
