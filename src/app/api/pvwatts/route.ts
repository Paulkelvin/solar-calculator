/**
 * NREL PVWatts API Proxy
 * Phase 1 Enhancement: Real solar production estimates
 * Priority Fix #5: State-specific sun hours fallback
 * 
 * API Docs: https://developer.nrel.gov/docs/solar/pvwatts/v8/
 */

import { getPeakSunHours } from "@/lib/state-sun-hours";

export const dynamic = 'force-dynamic';

interface PVWattsRequest {
  latitude: number;
  longitude: number;
  systemCapacity: number; // kW
  moduleType?: number; // 0=Standard, 1=Premium, 2=Thin film
  losses?: number; // System losses % (default 14.08)
  arrayType?: number; // 0=Fixed, 1=1-axis, 2=2-axis, 3=1-axis backtracking, 4=Fixed roof
  tilt?: number; // degrees
  azimuth?: number; // degrees (180=south)
  stateCode?: string; // For state-specific fallback (Priority Fix #5)
}

interface PVWattsResponse {
  outputs: {
    ac_monthly: number[]; // Monthly AC production (kWh)
    poa_monthly: number[]; // Plane of array irradiance (kWh/m²/day)
    solrad_monthly: number[]; // Solar radiation (kWh/m²/day)
    dc_monthly: number[]; // Monthly DC production (kWh)
    ac_annual: number; // Annual AC production (kWh)
    solrad_annual: number; // Annual solar radiation (kWh/m²/day)
    capacity_factor: number; // %
  };
  station_info: {
    city: string;
    state: string;
    elevation: number;
    distance: number;
  };
}

export async function POST(request: Request) {
  let parsedBody: PVWattsRequest | null = null;
  try {
    parsedBody = await request.json();
    const body: PVWattsRequest = parsedBody;
    const { 
      latitude, 
      longitude, 
      systemCapacity,
      moduleType = 0,
      losses = 14.08,
      arrayType = 4, // Fixed roof mount
      tilt = 20,
      azimuth = 180,
      stateCode
    } = body;

    // Validate inputs; fallback instead of hard 400s so UI keeps working
    if (!latitude || !longitude || !systemCapacity) {
      return getFallbackEstimates(systemCapacity ?? 5, latitude ?? 0, stateCode);
    }

    if (systemCapacity < 0.5 || systemCapacity > 100) {
      return getFallbackEstimates(
        Math.min(Math.max(systemCapacity, 0.5), 100),
        latitude,
        stateCode
      );
    }

    const apiKey = process.env.NREL_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.warn('[PVWatts] NREL_API_KEY not configured - using fallback estimates');
      return getFallbackEstimates(systemCapacity, latitude, stateCode);
    }

    // Call NREL PVWatts v8 API
    const params = new URLSearchParams({
      api_key: apiKey,
      lat: latitude.toString(),
      lon: longitude.toString(),
      system_capacity: systemCapacity.toString(),
      module_type: moduleType.toString(),
      losses: losses.toString(),
      array_type: arrayType.toString(),
      tilt: tilt.toString(),
      azimuth: azimuth.toString(),
      timeframe: 'monthly'
    });

    const url = `https://developer.nrel.gov/api/pvwatts/v8.json?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`NREL PVWatts API error: ${response.status} ${response.statusText}`);
      return getFallbackEstimates(systemCapacity, latitude, stateCode);
    }

    const data: PVWattsResponse = await response.json();

    if (!data.outputs) {
      console.error('NREL PVWatts API returned no outputs');
      return getFallbackEstimates(systemCapacity, latitude, stateCode);
    }

    // Calculate additional metrics
    const annualProduction = data.outputs.ac_annual;
    const monthlyProduction = data.outputs.ac_monthly;
    const capacityFactor = data.outputs.capacity_factor;
    
    // Estimate savings (US average $0.15/kWh, adjust by state)
    const averageRate = 0.15;
    const annualSavings = Math.round(annualProduction * averageRate);
    const monthlySavings = monthlyProduction.map(kwh => Math.round(kwh * averageRate));

    return Response.json({
      success: true,
      source: 'nrel',
      location: data.station_info,
      production: {
        annual: Math.round(annualProduction),
        monthly: monthlyProduction.map(v => Math.round(v)),
        capacityFactor: Math.round(capacityFactor * 10) / 10,
      },
      radiation: {
        annual: Math.round(data.outputs.solrad_annual * 365 * 10) / 10,
        monthly: data.outputs.solrad_monthly.map(v => Math.round(v * 10) / 10),
      },
      savings: {
        annual: annualSavings,
        monthly: monthlySavings,
        rate: averageRate,
      },
      system: {
        capacity: systemCapacity,
        tilt,
        azimuth,
        losses,
      }
    });

  } catch (error) {
    console.error('PVWatts API error:', error);
    // On network/timeout or parse errors, fall back to deterministic estimates
    const fallbackCapacity = parsedBody?.systemCapacity ?? 5;
    const fallbackLat = parsedBody?.latitude ?? 0;
    const fallbackState = parsedBody?.stateCode;
    return getFallbackEstimates(fallbackCapacity, fallbackLat, fallbackState);
  }
}

/**
 * Fallback estimates when NREL API is unavailable
 * Priority Fix #5: Uses state-specific peak sun hours from NREL data
 */
function getFallbackEstimates(systemCapacity: number, latitude: number, stateCode?: string) {
  // Get state-specific peak sun hours from lookup table
  const peakSunHours = getPeakSunHours(stateCode);
  
  // Annual production = System size (kW) × Peak sun hours × 365 days × System efficiency (0.75)
  const annualProduction = Math.round(systemCapacity * peakSunHours * 365 * 0.75);
  
  // Monthly breakdown (simplified seasonal variation)
  const monthlyFactors = [0.7, 0.8, 0.95, 1.05, 1.15, 1.2, 1.25, 1.2, 1.05, 0.9, 0.75, 0.65];
  const monthlyProduction = monthlyFactors.map(factor => 
    Math.round((annualProduction / 12) * factor)
  );

  const averageRate = 0.15;
  const annualSavings = Math.round(annualProduction * averageRate);
  const monthlySavings = monthlyProduction.map(kwh => Math.round(kwh * averageRate));

  return Response.json({
    success: true,
    source: 'fallback',
    location: {
      city: 'Estimated',
      state: stateCode || '',
      distance: 0,
    },
    production: {
      annual: annualProduction,
      monthly: monthlyProduction,
      capacityFactor: Math.round((annualProduction / (systemCapacity * 8760)) * 1000) / 10,
    },
    radiation: {
      annual: Math.round(peakSunHours * 365 * 10) / 10,
      monthly: Array(12).fill(Math.round(peakSunHours * 30 * 10) / 10),
    },
    savings: {
      annual: annualSavings,
      monthly: monthlySavings,
      rate: averageRate,
    },
    system: {
      capacity: systemCapacity,
      tilt: 20,
      azimuth: 180,
      losses: 14.08,
    }
  });
}
