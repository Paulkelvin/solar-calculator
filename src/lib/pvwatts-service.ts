/**
 * PVWatts Service
 * Wrapper for NREL PVWatts API integration
 */

export interface ProductionEstimate {
  annual: number; // kWh
  monthly: number[]; // kWh per month
  capacityFactor: number; // %
}

export interface SavingsEstimate {
  annual: number; // USD
  monthly: number[]; // USD per month
  rate: number; // $/kWh
}

export interface PVWattsResult {
  success: boolean;
  source: 'nrel' | 'fallback';
  note?: string;
  location: {
    city: string;
    state: string;
    distance: number;
  };
  production: ProductionEstimate;
  radiation: {
    annual: number;
    monthly: number[];
  };
  savings: SavingsEstimate;
  system: {
    capacity: number;
    tilt: number;
    azimuth: number;
    losses: number;
  };
}

/**
 * Fetch solar production estimates from PVWatts API
 * Priority Fix #5: Pass state code for better fallback estimates
 */
export async function fetchProductionEstimate(
  latitude: number,
  longitude: number,
  systemCapacity: number,
  options?: {
    tilt?: number;
    azimuth?: number;
    moduleType?: number;
    losses?: number;
    stateCode?: string;
  }
): Promise<PVWattsResult | null> {
  try {
    const response = await fetch('/api/pvwatts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude,
        longitude,
        systemCapacity,
        tilt: options?.tilt,
        azimuth: options?.azimuth,
        moduleType: options?.moduleType,
        losses: options?.losses,
        stateCode: options?.stateCode,
      }),
    });

    if (!response.ok) {
      console.error('PVWatts API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching production estimate:', error);
    return null;
  }
}

/**
 * Calculate bill offset percentage
 */
export function calculateBillOffset(
  annualProduction: number,
  annualUsage: number
): number {
  if (!annualUsage || annualUsage === 0) return 0;
  return Math.min(Math.round((annualProduction / annualUsage) * 100), 100);
}

/**
 * Get month names for charts
 */
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Format monthly data for Recharts
 */
export function formatMonthlyData(monthly: number[]) {
  return monthly.map((value, index) => ({
    month: MONTH_NAMES[index],
    value: Math.round(value),
  }));
}
