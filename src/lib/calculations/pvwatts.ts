/**
 * NREL PVWatts API Integration
 * Calculates real solar production estimates based on location and system size
 *
 * API Docs: https://pvwatts.nrel.gov/
 */

interface PVWattsResponse {
  version: string;
  metadata: {
    sources: string[];
    warnings: string[];
    errors: string[];
  };
  outputs: {
    ac_monthly: number[];
    poa_monthly: number[];
    solrad_monthly: number[];
    dc_monthly: number[];
  };
}

/**
 * Fetch solar production data from NREL PVWatts API
 * @param latitude - Property latitude
 * @param longitude - Property longitude
 * @param systemSize - System size in kW
 * @param tilt - Array tilt in degrees (default: optimal)
 * @param azimuth - Array azimuth in degrees (default: 180 for north hemisphere)
 * @returns Monthly and annual production in kWh
 */
export async function fetchPVWattsData(
  latitude: number,
  longitude: number,
  systemSize: number,
  tilt: number = 20,
  azimuth: number = 180
) {
  try {
    // NREL PVWatts API requires an API key
    const apiKey = process.env.NREL_API_KEY;
    if (!apiKey) {
      console.warn('NREL_API_KEY not configured - using fallback calculations');
      return null;
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      lat: latitude.toString(),
      lon: longitude.toString(),
      system_capacity: systemSize.toString(),
      module_type: '1', // Standard module
      losses: '14.08', // Default NREL losses
      array_type: '1', // Fixed - Open Rack
      tilt: tilt.toString(),
      azimuth: azimuth.toString(),
    });

    const url = `https://api.pvwatts.nrel.gov/api/pvwatts/v8/json?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`NREL API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: PVWattsResponse = await response.json();

    if (data.metadata.errors && data.metadata.errors.length > 0) {
      console.error('NREL API errors:', data.metadata.errors);
      return null;
    }

    // Calculate annual production
    const annualProduction = data.outputs.ac_monthly.reduce((sum, monthly) => sum + monthly, 0);

    return {
      annualProduction: Math.round(annualProduction),
      monthlyProduction: data.outputs.ac_monthly.map((v) => Math.round(v)),
      systemSize,
      location: { latitude, longitude },
    };
  } catch (error) {
    console.error('PVWatts API error:', error);
    return null;
  }
}

/**
 * Get optimal tilt angle based on latitude
 * Rule of thumb: Tilt angle ≈ latitude for year-round production
 */
export function getOptimalTilt(latitude: number): number {
  // Clamp between 5 and 50 degrees
  return Math.max(5, Math.min(50, latitude));
}

/**
 * Get azimuth based on hemisphere
 * Northern hemisphere: 180° (South-facing)
 * Southern hemisphere: 0° (North-facing)
 */
export function getOptimalAzimuth(latitude: number): number {
  return latitude >= 0 ? 180 : 0;
}

/**
 * Calculate production using fallback formula when API is unavailable
 * Based on typical US average of 1200-1300 kWh/kW/year
 */
export function calculateFallbackProduction(
  systemSize: number,
  state: string
): { annualProduction: number; monthlyProduction: number[] } {
  // Regional production factors (kWh/kW/year)
  const productionFactors: Record<string, number> = {
    // High sun
    AZ: 1450,
    NM: 1400,
    NV: 1400,
    CA: 1350,
    TX: 1300,
    FL: 1250,
    // Medium sun
    CO: 1350,
    UT: 1350,
    NC: 1150,
    SC: 1150,
    GA: 1150,
    // Lower sun (Northeast)
    MA: 1050,
    NY: 1000,
    PA: 1000,
    NJ: 1050,
    CT: 1000,
    VT: 950,
    // Default (middle of range)
  };

  // Get production factor for state, default to 1200
  const factor = productionFactors[state.toUpperCase()] || 1200;

  // Calculate annual production
  const annualProduction = Math.round(systemSize * factor);

  // Distribute monthly based on seasonal variation
  // Assume 15% higher in summer, 15% lower in winter
  const monthlyProduction = [
    Math.round((annualProduction / 12) * 0.85), // Jan
    Math.round((annualProduction / 12) * 0.87), // Feb
    Math.round((annualProduction / 12) * 1.0), // Mar
    Math.round((annualProduction / 12) * 1.1), // Apr
    Math.round((annualProduction / 12) * 1.15), // May
    Math.round((annualProduction / 12) * 1.18), // Jun
    Math.round((annualProduction / 12) * 1.15), // Jul
    Math.round((annualProduction / 12) * 1.1), // Aug
    Math.round((annualProduction / 12) * 1.0), // Sep
    Math.round((annualProduction / 12) * 0.9), // Oct
    Math.round((annualProduction / 12) * 0.8), // Nov
    Math.round((annualProduction / 12) * 0.82), // Dec
  ];

  return { annualProduction, monthlyProduction };
}
