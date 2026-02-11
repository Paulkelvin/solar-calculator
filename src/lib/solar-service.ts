/**
 * Solar Data Service
 * Phase 5.2: Fetches and transforms real Google Solar API data
 * 
 * Responsibilities:
 * - Call the /api/google-solar route with coordinates
 * - Transform Google Solar response to UI-friendly format
 * - Handle loading/error states gracefully
 * - Fallback to mock data if API unavailable
 */

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
    const response = await fetch('/api/google-solar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    });

    if (!response.ok) {
      console.error(`Solar API error: ${response.status}`);
      return MOCK_SOLAR_RESPONSE;
    }

    const data = await response.json();
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

    const roofSegments = googleResponse.roofSegments || [];
    const panelConfigs = googleResponse.panelConfigs || [];
    // Use the LAST (largest) config — panelConfigs are sorted ascending by panelsCount
    const maxConfig = panelConfigs[panelConfigs.length - 1] || panelConfigs[0];

    const totalAreaMeters = googleResponse.wholeRoofArea || roofSegments.reduce((sum: number, seg: any) => sum + (seg.area || 0), 0);
    const roofAreaSqft = totalAreaMeters ? Math.round(totalAreaMeters * 10.764) : MOCK_SOLAR_RESPONSE.roofAreaSqft;

    const avgSunExposure = roofSegments.length > 0
      ? roofSegments.reduce((sum: number, seg: any) => sum + (seg.sunExposure ?? 75), 0) / roofSegments.length
      : 75;

    const estimatedAnnualKwh = maxConfig?.yearlyEnergyKwh || Math.round((avgSunExposure / 100) * 10000);
    const panelCapacityWatts = maxConfig
      ? Math.round((maxConfig.systemSizeKw ?? (maxConfig.panelsCount || 0) * 0.4) * 1000)
      : Math.round((googleResponse.maxArrayPanels || 18) * 400);

    const solarPotentialLevel = avgSunExposure >= 80 ? 'high' : avgSunExposure >= 60 ? 'medium' : 'low';
    const shadingPercentage = Math.max(0, 100 - Math.round(avgSunExposure));
    const confidence = googleResponse.imageryQuality === 'HIGH' ? 95 : googleResponse.imageryQuality === 'MEDIUM' ? 88 : 80;
    const source = googleResponse._source === 'google_solar_api' ? 'real' : 'mock';

    return {
      panelCapacityWatts: Math.round(panelCapacityWatts),
      estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
      estimatedMonthlyKwh: Math.round(estimatedAnnualKwh / 12),
      solarPotential: solarPotentialLevel,
      roofAreaSqft,
      sunExposurePercentage: Math.max(0, Math.min(100, Math.round(avgSunExposure))),
      shadingPercentage,
      confidence,
      source,
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
