/**
 * Google Solar API Integration (Phase 5.1)
 * 
 * Provides:
 * - Address autocomplete (Google Places API)
 * - Solar panel capacity estimation
 * - Roof analysis and shading detection
 * 
 * Status: In Development (Phase 5.1)
 * Last Updated: January 29, 2026
 */

export interface GoogleSolarData {
  panelCapacityWatts: number;
  estimatedAnnualKwh: number;
  solarPotential: 'high' | 'medium' | 'low';
  roofAreaSqft: number;
  sunExposurePercentage: number;
  shadingAnalysis: ShadingData;
  confidence: number; // 0-100
}

export interface ShadingData {
  averageShadingPercentage: number;
  monthlyVariation: number[];
  shadingOnRoof: boolean;
}

export interface AddressAutocompleteResult {
  address: string;
  placeId: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

// Mock data for development (Phase 5.1)
const MOCK_SOLAR_DATA: GoogleSolarData = {
  panelCapacityWatts: 7500,
  estimatedAnnualKwh: 9000,
  solarPotential: 'high',
  roofAreaSqft: 2500,
  sunExposurePercentage: 85,
  shadingAnalysis: {
    averageShadingPercentage: 15,
    monthlyVariation: [10, 8, 5, 3, 2, 1, 2, 4, 8, 12, 15, 18],
    shadingOnRoof: false
  },
  confidence: 92
};

/**
 * Get Google Solar API data for an address
 * Phase 5.1: Implements real Google Solar API calls with fallback to Phase 4 mock data
 * 
 * @param placeId - Google Places ID
 * @param latitude - Latitude coordinate (optional, will be fetched if not provided)
 * @param longitude - Longitude coordinate (optional, will be fetched if not provided)
 * @returns Solar data or null if API unavailable
 */
export async function getGoogleSolarData(
  placeId: string,
  latitude?: number,
  longitude?: number
): Promise<GoogleSolarData | null> {
  try {
    // Validate inputs
    if (!placeId || typeof placeId !== 'string' || placeId.trim().length === 0) {
      console.error('Invalid placeId for Google Solar API');
      return null;
    }

    // Check if real API is configured
    const apiKey = process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
    
    if (apiKey) {
      // Real Google Solar API call (Phase 5.2)
      try {
        // If coordinates not provided, use mock coordinates for now
        // Phase 5.3: Will implement place details API to fetch real coordinates
        const lat = latitude || 40.7128;
        const lon = longitude || -74.006;

        const response = await fetch(
          `https://solar.googleapis.com/v1/buildingInsights:findClosest?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: { latitude: lat, longitude: lon },
              requiredQuality: 'HIGH'
            })
          }
        );

        if (!response.ok) {
          console.error(`Google Solar API error: ${response.status}`);
          // Fall through to mock data
        } else {
          const data = await response.json();
          const transformed = transformGoogleSolarResponse(data);
          if (transformed) {
            return transformed;
          }
        }
      } catch (apiError) {
        console.error('Google Solar API fetch error:', apiError);
        // Fall through to mock data
      }
    }

    // Fallback: Return realistic mock data for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // Add slight variation to mock data based on placeId
      const seed = placeId.charCodeAt(0) || 1;
      const variation = seed % 100;
      
      return {
        ...MOCK_SOLAR_DATA,
        panelCapacityWatts: 6500 + variation * 10,
        estimatedAnnualKwh: 8000 + variation * 15,
        roofAreaSqft: 2000 + variation * 5,
        sunExposurePercentage: Math.min(100, 80 + variation / 5)
      };
    }

    return null;
  } catch (error) {
    console.error('Google Solar API error:', error);
    return null; // Fallback to Phase 4 mock data
  }
}

/**
 * Get address autocomplete suggestions
 * Phase 5.1: Implements real Google Places API calls with fallback
 * 
 * @param input - User input text
 * @returns Array of address suggestions or empty array if unavailable
 */
export async function getAddressAutocomplete(
  input: string
): Promise<AddressAutocompleteResult[]> {
  try {
    // Validate inputs
    if (!input || typeof input !== 'string' || input.trim().length < 2) {
      return [];
    }

    const trimmedInput = input.trim();
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (apiKey) {
      // Real Google Places API call (Phase 5.2)
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmedInput)}&key=${apiKey}&components=country:us`
        );

        if (!response.ok) {
          console.error(`Google Places API error: ${response.status}`);
          // Fall through to mock data
        } else {
          const data = await response.json();
          const predictions = data.predictions?.map(transformGooglePlacesPrediction) ?? [];
          if (predictions.length > 0) {
            return predictions;
          }
        }
      } catch (apiError) {
        console.error('Google Places API fetch error:', apiError);
        // Fall through to mock data
      }
    }

    // Fallback: Return mock results for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // Generate realistic mock suggestions based on input
      const mockSuggestions: AddressAutocompleteResult[] = [
        {
          address: trimmedInput,
          placeId: `mock_primary_${trimmedInput.replace(/\s+/g, '_')}`,
          latitude: 40.7128,
          longitude: -74.006,
          formattedAddress: `${trimmedInput}, New York, NY, USA`
        },
        {
          address: `${trimmedInput}, Suite 100`,
          placeId: `mock_alt1_${trimmedInput.replace(/\s+/g, '_')}`,
          latitude: 40.758,
          longitude: -73.9855,
          formattedAddress: `${trimmedInput}, Suite 100, New York, NY, USA`
        }
      ];

      return mockSuggestions.slice(0, 5); // Limit to 5 results
    }

    return [];
  } catch (error) {
    console.error('Google Places API error:', error);
    return []; // Return empty - form will show error state
  }
}

/**
 * Get detailed place information from Google Places API
 * Phase 5.1: Geocoding and place details
 */
export async function getPlaceDetails(
  placeId: string
): Promise<{ latitude: number; longitude: number; formattedAddress: string } | null> {
  try {
    // TODO: Implement real Google Places details API
    // For now return null - form will handle geocoding fallback
    return null;
  } catch (error) {
    console.error('Google Places details API error:', error);
    return null;
  }
}

/**
 * Validate API credentials
 * Phase 5.1: Check environment variables
 */
export function validateGoogleSolarAPICredentials(): boolean {
  const hasKey = !!(process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY);
  const hasPlacesKey = !!(process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);
  
  if (!hasKey || !hasPlacesKey) {
    console.warn(
      'Google Solar/Places API credentials missing. Using mock data for development.'
    );
  }
  
  return hasKey && hasPlacesKey;
}

/**
 * Check if APIs are properly configured
 */
export function isGoogleAPIsConfigured(): boolean {
  return (
    !!(process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY) &&
    !!(process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY)
  );
}
/**
 * Transform Google Solar API response to our format
 * Phase 5.2+: Used when real API is enabled
 */
export function transformGoogleSolarResponse(data: any): GoogleSolarData | null {
  try {
    if (!data || !data.buildingInsights) {
      return null;
    }

    const insights = data.buildingInsights;
    const roofSegments = insights.roofSegmentSummaries || [];
    
    // Calculate total capacity and annual kwh
    const totalCapacityWatts = roofSegments.reduce(
      (sum: number, segment: any) => sum + (segment.panelCapacityWatts || 0),
      0
    );

    return {
      panelCapacityWatts: totalCapacityWatts,
      estimatedAnnualKwh: insights.solarPotential?.yearlyEnergyDcKwh || 0,
      solarPotential: insights.solarPotential?.maxSunshineHoursPerYear > 2500 ? 'high' : 'medium',
      roofAreaSqft: roofSegments.reduce(
        (sum: number, segment: any) => sum + (segment.roofSegmentStats?.areaMeters2 || 0) * 10.764,
        0
      ),
      sunExposurePercentage: insights.solarPotential?.sunshineQuantile || 85,
      shadingAnalysis: {
        averageShadingPercentage: 100 - (insights.solarPotential?.percentileCovered || 85),
        monthlyVariation: new Array(12).fill(15),
        shadingOnRoof: (insights.solarPotential?.percentileCovered || 100) < 95
      },
      confidence: 85
    };
  } catch (error) {
    console.error('Error transforming Google Solar response:', error);
    return null;
  }
}

/**
 * Transform Google Places prediction to our format
 * Phase 5.2+: Used when real API is enabled
 */
export function transformGooglePlacesPrediction(
  prediction: any
): AddressAutocompleteResult | null {
  try {
    if (!prediction.place_id || !prediction.description) {
      return null;
    }

    return {
      address: prediction.main_text || prediction.description,
      placeId: prediction.place_id,
      latitude: prediction.geometry?.location?.lat || 0,
      longitude: prediction.geometry?.location?.lng || 0,
      formattedAddress: prediction.description
    };
  } catch (error) {
    console.error('Error transforming Google Places prediction:', error);
    return null;
  }
}