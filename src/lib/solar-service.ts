/**
 * Solar Data Service
 * Phase 5.2: Fetches and transforms real Google Solar API data
 * 
 * Responsibilities:
 * - Call the /api/google/solar proxy route with coordinates
 * - Transform Google Solar response to UI-friendly format
 * - Handle loading/error states gracefully
 * - Fallback to mock data if API unavailable
 */

import type { GoogleSolarData } from "./apis/google-solar-api";

export interface SolarDataResponse {
  panelCapacityWatts: number;
  estimatedAnnualKwh: number;
  estimatedMonthlyKwh: number;
  solarPotential: 'high' | 'medium' | 'low';
  roofAreaSqft: number;
  sunExposurePercentage: number;
  shadingPercentage: number;
  confidence: number;
  source: 'real' | 'mock';
}

/**
 * Mock solar data for fallback
 */
const MOCK_SOLAR_RESPONSE: SolarDataResponse = {
  panelCapacityWatts: 7500,
  estimatedAnnualKwh: 9000,
  estimatedMonthlyKwh: 750,
  solarPotential: 'high',
  roofAreaSqft: 2500,
  sunExposurePercentage: 85,
  shadingPercentage: 15,
  confidence: 85,
  source: 'mock'
};

/**
 * Fetch real solar data from Google Solar API via proxy
 * 
 * @param latitude - Property latitude
 * @param longitude - Property longitude
 * @returns Solar data response or mock data on failure
 */
export async function fetchSolarData(
  latitude: number,
  longitude: number
): Promise<SolarDataResponse> {
  try {
    if (!latitude || !longitude) {
      console.warn('Missing coordinates for solar data fetch');
      return MOCK_SOLAR_RESPONSE;
    }

    // Call the proxy route (no CORS issues, server-to-server)
    const response = await fetch('/api/google/solar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    });

    if (!response.ok) {
      console.error(`Solar API error: ${response.status}`);
      return MOCK_SOLAR_RESPONSE;
    }

    const data = await response.json();
    
    // Transform Google Solar API response to UI format
    return transformGoogleSolarResponse(data);
  } catch (error) {
    console.error('Error fetching solar data:', error);
    // Graceful fallback to mock data
    return MOCK_SOLAR_RESPONSE;
  }
}

/**
 * Transform Google Solar API response to UI-friendly format
 * Handles the complex Google response and extracts key metrics
 * 
 * @param googleResponse - Raw response from Google Solar API
 * @returns Formatted solar data for UI
 */
function transformGoogleSolarResponse(googleResponse: any): SolarDataResponse {
  try {
    if (!googleResponse) {
      return MOCK_SOLAR_RESPONSE;
    }

    // Extract buildingInsights (main data container)
    const buildingInsights = googleResponse.buildingInsights;
    if (!buildingInsights) {
      return MOCK_SOLAR_RESPONSE;
    }

    // Extract solar potential info
    const solarPotential = buildingInsights.solarPotential;
    if (!solarPotential) {
      return MOCK_SOLAR_RESPONSE;
    }

    // Parse panel capacity (convert Watts to match UI format)
    const panelCapacityWatts = 
      solarPotential.panelCapacityWatts || 7500;

    // Parse annual production energy
    const yearlyEnergyKwh = 
      solarPotential.yearlyEnergyKwhAc || 
      solarPotential.yearlyEnergyKwh || 
      9000;

    // Determine solar potential level
    const potentialEnum = solarPotential.solarPotentialEnum || 'MEDIUM';
    const solarPotentialLevel = 
      potentialEnum === 'HIGH' ? 'high' :
      potentialEnum === 'MEDIUM' ? 'medium' :
      'low';

    // Parse roof area (convert m² to sq ft if needed)
    let roofAreaSqft = solarPotential.maxArrayAreaMeters2;
    if (roofAreaSqft) {
      // Convert square meters to square feet (1 m² = 10.764 sq ft)
      roofAreaSqft = Math.round(roofAreaSqft * 10.764);
    } else {
      roofAreaSqft = 2500; // Default fallback
    }

    // Parse sun exposure (as percentage)
    const sunExposurePercentage = 
      (solarPotential.percentageExposedToSun || 85) * 1;

    // Parse shading information
    const monthlyShading = solarPotential.monthlyShading || [];
    const averageShadingPercentage = 
      monthlyShading.length > 0
        ? Math.round(monthlyShading.reduce((a, b) => a + b, 0) / monthlyShading.length)
        : 15;

    // Confidence level (0-100)
    const confidence = googleResponse.imageQuality === 'HIGH' ? 95 : 80;

    return {
      panelCapacityWatts: Math.round(panelCapacityWatts),
      estimatedAnnualKwh: Math.round(yearlyEnergyKwh),
      estimatedMonthlyKwh: Math.round(yearlyEnergyKwh / 12),
      solarPotential: solarPotentialLevel,
      roofAreaSqft,
      sunExposurePercentage,
      shadingPercentage: averageShadingPercentage,
      confidence,
      source: 'real'
    };
  } catch (error) {
    console.error('Error transforming solar response:', error);
    return MOCK_SOLAR_RESPONSE;
  }
}

/**
 * Get solar data with loading state management
 * Useful for components that need to track loading state
 * 
 * @param latitude - Property latitude
 * @param longitude - Property longitude
 * @param onLoad - Callback when data loads
 * @param onError - Callback on error
 */
export async function fetchSolarDataWithState(
  latitude: number,
  longitude: number,
  onLoad?: (data: SolarDataResponse) => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const data = await fetchSolarData(latitude, longitude);
    onLoad?.(data);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError?.(err);
  }
}
