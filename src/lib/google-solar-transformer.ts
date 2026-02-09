/**
 * Google Solar API Data Transformer
 * Converts Google Solar API responses to our app's data structures
 */

import type { RoofSegment } from "../store/calculatorStore";

/**
 * Transform Google Solar API roof segments
 * Extracts roof segment data from buildingInsights.roofSegmentSummaries
 */
export function transformRoofSegments(googleSolarData: any): RoofSegment[] {
  try {
    if (!googleSolarData?.buildingInsights?.roofSegmentSummaries) {
      return [];
    }

    const segments = googleSolarData.buildingInsights.roofSegmentSummaries;
    
    return segments.map((segment: any) => {
      const stats = segment.stats || segment.roofSegmentStats || {};
      const bounds = segment.center || {};
      
      // Calculate bounds from center (approximate 10m x 10m area)
      const latOffset = 0.00005; // ~5.5 meters
      const lngOffset = 0.00005;
      
      return {
        bounds: {
          north: (bounds.latitude || 0) + latOffset,
          south: (bounds.latitude || 0) - latOffset,
          east: (bounds.longitude || 0) + lngOffset,
          west: (bounds.longitude || 0) - lngOffset,
        },
        area: stats.areaMeters2 || 0,
        solarPotential: segment.yearlyEnergyDcKwh || 0,
        sunExposure: stats.sunshineQuantiles?.[1] || 75, // median quantile
        azimuth: stats.azimuthDegrees || 180,
        tilt: stats.pitchDegrees || 20,
      };
    });
  } catch (error) {
    console.error("Error transforming roof segments:", error);
    return [];
  }
}

/**
 * Generate mock roof segments for testing
 * Used when Google Solar API is unavailable
 * Priority Fix #4: Balanced orientations for realism
 */
export function generateMockRoofSegments(
  latitude: number,
  longitude: number,
  roofAreaSqft: number = 2500
): RoofSegment[] {
  // Create 3-6 mock segments for variety
  const numSegments = Math.floor(Math.random() * 4) + 3;
  const areaPerSegment = (roofAreaSqft * 0.092903) / numSegments; // Convert to m²
  
  const segments: RoofSegment[] = [];
  const latOffset = 0.00005; // ~5.5 meters
  const lngOffset = 0.00005;
  
  // Define common roof orientations with realistic distribution
  const orientations = [
    { azimuth: 180, weight: 0.25 }, // South (best for Northern Hemisphere)
    { azimuth: 0, weight: 0.20 },   // North
    { azimuth: 90, weight: 0.20 },  // East
    { azimuth: 270, weight: 0.20 }, // West
    { azimuth: 135, weight: 0.075 }, // Southeast
    { azimuth: 225, weight: 0.075 }, // Southwest
  ];
  
  for (let i = 0; i < numSegments; i++) {
    const offsetLat = latitude + (Math.random() - 0.5) * latOffset * 2;
    const offsetLng = longitude + (Math.random() - 0.5) * lngOffset * 2;
    
    // Select orientation based on weighted distribution
    const random = Math.random();
    let cumulativeWeight = 0;
    let selectedAzimuth = 180; // Default to south
    
    for (const orientation of orientations) {
      cumulativeWeight += orientation.weight;
      if (random <= cumulativeWeight) {
        selectedAzimuth = orientation.azimuth;
        break;
      }
    }
    
    // Add small variation (±15°) to make it more realistic
    const azimuthVariation = selectedAzimuth + (Math.random() - 0.5) * 30;
    const finalAzimuth = Math.max(0, Math.min(360, azimuthVariation));
    
    // Adjust sun exposure based on orientation
    // South-facing segments get higher exposure, north-facing lower
    const orientationFactor = 
      selectedAzimuth === 180 ? 1.0 :  // South: 100%
      selectedAzimuth === 0 ? 0.6 :    // North: 60%
      selectedAzimuth === 90 || selectedAzimuth === 270 ? 0.85 : // E/W: 85%
      0.9; // SE/SW: 90%
    
    // Latitude adjustment: Higher latitudes benefit more from south-facing
    const latitudeFactor = Math.abs(latitude) / 50; // 0-1 scale
    const baseExposure = 65 + (25 * orientationFactor) + (10 * latitudeFactor);
    const sunExposure = Math.max(50, Math.min(95, Math.round(baseExposure + (Math.random() - 0.5) * 10)));
    
    segments.push({
      bounds: {
        north: offsetLat + latOffset,
        south: offsetLat - latOffset,
        east: offsetLng + lngOffset,
        west: offsetLng - lngOffset,
      },
      area: areaPerSegment * (0.8 + Math.random() * 0.4), // Vary size ±20%
      solarPotential: Math.round((1000 + Math.random() * 2500) * orientationFactor), // 1000-3500 kWh/year, scaled by orientation
      sunExposure,
      azimuth: Math.round(finalAzimuth),
      tilt: 15 + Math.round(Math.random() * 25), // 15-40°
    });
  }
  
  return segments;
}
