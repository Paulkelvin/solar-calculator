/**
 * State-specific average peak sun hours data
 * Source: NREL Solar Resource Data (National Solar Radiation Database)
 * Priority Fix #5: Enhances PVWatts fallback with realistic state-level data
 * 
 * Peak sun hours = hours per day of 1000 W/m² solar irradiance
 * Annual values averaged across all seasons
 */

export interface StateSunHours {
  state: string;
  stateCode: string;
  peakSunHours: number; // Average daily peak sun hours
  annualSunHours: number; // Approximate annual total
  solarRadiation: number; // Average kWh/m²/day
  avgTilt: number; // Typical roof tilt (degrees) for optimal production
  avgAzimuth: number; // Typical optimal azimuth (180 = south)
  avgShading: number; // Typical shading percentage (0-100)
}

export const STATE_SUN_HOURS: Record<string, StateSunHours> = {
  // Southwest - Highest solar potential
  AZ: { state: "Arizona", stateCode: "AZ", peakSunHours: 6.5, annualSunHours: 2372, solarRadiation: 6.57, avgTilt: 22, avgAzimuth: 180, avgShading: 8 },
  NM: { state: "New Mexico", stateCode: "NM", peakSunHours: 6.2, annualSunHours: 2263, solarRadiation: 6.27, avgTilt: 23, avgAzimuth: 180, avgShading: 10 },
  NV: { state: "Nevada", stateCode: "NV", peakSunHours: 6.0, annualSunHours: 2190, solarRadiation: 5.98, avgTilt: 24, avgAzimuth: 180, avgShading: 5 },
  
  // West - High solar potential
  CA: { state: "California", stateCode: "CA", peakSunHours: 5.8, annualSunHours: 2117, solarRadiation: 5.82, avgTilt: 18, avgAzimuth: 180, avgShading: 12 },
  CO: { state: "Colorado", stateCode: "CO", peakSunHours: 5.5, annualSunHours: 2007, solarRadiation: 5.50, avgTilt: 25, avgAzimuth: 180, avgShading: 10 },
  UT: { state: "Utah", stateCode: "UT", peakSunHours: 5.6, annualSunHours: 2044, solarRadiation: 5.60, avgTilt: 26, avgAzimuth: 180, avgShading: 8 },
  WY: { state: "Wyoming", stateCode: "WY", peakSunHours: 5.3, annualSunHours: 1934, solarRadiation: 5.33, avgTilt: 28, avgAzimuth: 180, avgShading: 12 },
  MT: { state: "Montana", stateCode: "MT", peakSunHours: 4.8, annualSunHours: 1752, solarRadiation: 4.80, avgTilt: 30, avgAzimuth: 180, avgShading: 15 },
  ID: { state: "Idaho", stateCode: "ID", peakSunHours: 5.0, annualSunHours: 1825, solarRadiation: 5.01, avgTilt: 28, avgAzimuth: 180, avgShading: 13 },
  OR: { state: "Oregon", stateCode: "OR", peakSunHours: 4.2, annualSunHours: 1533, solarRadiation: 4.20, avgTilt: 30, avgAzimuth: 180, avgShading: 20 },
  WA: { state: "Washington", stateCode: "WA", peakSunHours: 3.9, annualSunHours: 1423, solarRadiation: 3.90, avgTilt: 32, avgAzimuth: 180, avgShading: 22 },
  
  // Mountain States
  HI: { state: "Hawaii", stateCode: "HI", peakSunHours: 6.0, annualSunHours: 2190, solarRadiation: 6.02, avgTilt: 15, avgAzimuth: 180, avgShading: 15 },
  
  // Great Plains - Good solar potential
  TX: { state: "Texas", stateCode: "TX", peakSunHours: 5.3, annualSunHours: 1934, solarRadiation: 5.26, avgTilt: 20, avgAzimuth: 180, avgShading: 10 },
  OK: { state: "Oklahoma", stateCode: "OK", peakSunHours: 5.0, annualSunHours: 1825, solarRadiation: 5.02, avgTilt: 23, avgAzimuth: 180, avgShading: 12 },
  KS: { state: "Kansas", stateCode: "KS", peakSunHours: 5.2, annualSunHours: 1898, solarRadiation: 5.15, avgTilt: 24, avgAzimuth: 180, avgShading: 11 },
  NE: { state: "Nebraska", stateCode: "NE", peakSunHours: 5.0, annualSunHours: 1825, solarRadiation: 5.01, avgTilt: 26, avgAzimuth: 180, avgShading: 13 },
  SD: { state: "South Dakota", stateCode: "SD", peakSunHours: 4.8, annualSunHours: 1752, solarRadiation: 4.77, avgTilt: 28, avgAzimuth: 180, avgShading: 14 },
  ND: { state: "North Dakota", stateCode: "ND", peakSunHours: 4.5, annualSunHours: 1642, solarRadiation: 4.50, avgTilt: 30, avgAzimuth: 180, avgShading: 15 },
  
  // Southeast - Moderate to good
  FL: { state: "Florida", stateCode: "FL", peakSunHours: 5.5, annualSunHours: 2007, solarRadiation: 5.47, avgTilt: 18, avgAzimuth: 180, avgShading: 15 },
  GA: { state: "Georgia", stateCode: "GA", peakSunHours: 4.8, annualSunHours: 1752, solarRadiation: 4.74, avgTilt: 22, avgAzimuth: 180, avgShading: 18 },
  NC: { state: "North Carolina", stateCode: "NC", peakSunHours: 4.7, annualSunHours: 1715, solarRadiation: 4.71, avgTilt: 24, avgAzimuth: 180, avgShading: 17 },
  SC: { state: "South Carolina", stateCode: "SC", peakSunHours: 4.9, annualSunHours: 1788, solarRadiation: 4.90, avgTilt: 22, avgAzimuth: 180, avgShading: 16 },
  AL: { state: "Alabama", stateCode: "AL", peakSunHours: 4.6, annualSunHours: 1679, solarRadiation: 4.59, avgTilt: 21, avgAzimuth: 180, avgShading: 19 },
  MS: { state: "Mississippi", stateCode: "MS", peakSunHours: 4.7, annualSunHours: 1715, solarRadiation: 4.69, avgTilt: 21, avgAzimuth: 180, avgShading: 20 },
  LA: { state: "Louisiana", stateCode: "LA", peakSunHours: 4.7, annualSunHours: 1715, solarRadiation: 4.71, avgTilt: 20, avgAzimuth: 180, avgShading: 21 },
  TN: { state: "Tennessee", stateCode: "TN", peakSunHours: 4.5, annualSunHours: 1642, solarRadiation: 4.52, avgTilt: 24, avgAzimuth: 180, avgShading: 20 },
  AR: { state: "Arkansas", stateCode: "AR", peakSunHours: 4.7, annualSunHours: 1715, solarRadiation: 4.69, avgTilt: 23, avgAzimuth: 180, avgShading: 18 },
  
  // Mid-Atlantic - Moderate
  VA: { state: "Virginia", stateCode: "VA", peakSunHours: 4.5, annualSunHours: 1642, solarRadiation: 4.50, avgTilt: 26, avgAzimuth: 180, avgShading: 18 },
  WV: { state: "West Virginia", stateCode: "WV", peakSunHours: 4.0, annualSunHours: 1460, solarRadiation: 4.01, avgTilt: 27, avgAzimuth: 180, avgShading: 22 },
  MD: { state: "Maryland", stateCode: "MD", peakSunHours: 4.3, annualSunHours: 1569, solarRadiation: 4.30, avgTilt: 27, avgAzimuth: 180, avgShading: 19 },
  DE: { state: "Delaware", stateCode: "DE", peakSunHours: 4.4, annualSunHours: 1606, solarRadiation: 4.40, avgTilt: 27, avgAzimuth: 180, avgShading: 18 },
  DC: { state: "District of Columbia", stateCode: "DC", peakSunHours: 4.3, annualSunHours: 1569, solarRadiation: 4.30, avgTilt: 27, avgAzimuth: 180, avgShading: 20 },
  
  // Northeast - Lower to moderate
  NJ: { state: "New Jersey", stateCode: "NJ", peakSunHours: 4.3, annualSunHours: 1569, solarRadiation: 4.32, avgTilt: 28, avgAzimuth: 180, avgShading: 20 },
  NY: { state: "New York", stateCode: "NY", peakSunHours: 4.0, annualSunHours: 1460, solarRadiation: 4.01, avgTilt: 30, avgAzimuth: 180, avgShading: 22 },
  PA: { state: "Pennsylvania", stateCode: "PA", peakSunHours: 4.2, annualSunHours: 1533, solarRadiation: 4.15, avgTilt: 29, avgAzimuth: 180, avgShading: 21 },
  CT: { state: "Connecticut", stateCode: "CT", peakSunHours: 4.1, annualSunHours: 1496, solarRadiation: 4.10, avgTilt: 30, avgAzimuth: 180, avgShading: 21 },
  RI: { state: "Rhode Island", stateCode: "RI", peakSunHours: 4.2, annualSunHours: 1533, solarRadiation: 4.23, avgTilt: 30, avgAzimuth: 180, avgShading: 20 },
  MA: { state: "Massachusetts", stateCode: "MA", peakSunHours: 4.2, annualSunHours: 1533, solarRadiation: 4.15, avgTilt: 30, avgAzimuth: 180, avgShading: 21 },
  VT: { state: "Vermont", stateCode: "VT", peakSunHours: 3.9, annualSunHours: 1423, solarRadiation: 3.92, avgTilt: 32, avgAzimuth: 180, avgShading: 23 },
  NH: { state: "New Hampshire", stateCode: "NH", peakSunHours: 4.0, annualSunHours: 1460, solarRadiation: 4.01, avgTilt: 31, avgAzimuth: 180, avgShading: 22 },
  ME: { state: "Maine", stateCode: "ME", peakSunHours: 4.0, annualSunHours: 1460, solarRadiation: 3.98, avgTilt: 32, avgAzimuth: 180, avgShading: 23 },
  
  // Midwest - Moderate
  OH: { state: "Ohio", stateCode: "OH", peakSunHours: 4.2, annualSunHours: 1533, solarRadiation: 4.21, avgTilt: 29, avgAzimuth: 180, avgShading: 20 },
  IN: { state: "Indiana", stateCode: "IN", peakSunHours: 4.3, annualSunHours: 1569, solarRadiation: 4.30, avgTilt: 28, avgAzimuth: 180, avgShading: 19 },
  IL: { state: "Illinois", stateCode: "IL", peakSunHours: 4.4, annualSunHours: 1606, solarRadiation: 4.42, avgTilt: 28, avgAzimuth: 180, avgShading: 18 },
  MI: { state: "Michigan", stateCode: "MI", peakSunHours: 4.0, annualSunHours: 1460, solarRadiation: 4.01, avgTilt: 30, avgAzimuth: 180, avgShading: 21 },
  WI: { state: "Wisconsin", stateCode: "WI", peakSunHours: 4.2, annualSunHours: 1533, solarRadiation: 4.21, avgTilt: 30, avgAzimuth: 180, avgShading: 20 },
  MN: { state: "Minnesota", stateCode: "MN", peakSunHours: 4.3, annualSunHours: 1569, solarRadiation: 4.33, avgTilt: 31, avgAzimuth: 180, avgShading: 19 },
  IA: { state: "Iowa", stateCode: "IA", peakSunHours: 4.5, annualSunHours: 1642, solarRadiation: 4.50, avgTilt: 28, avgAzimuth: 180, avgShading: 17 },
  MO: { state: "Missouri", stateCode: "MO", peakSunHours: 4.6, annualSunHours: 1679, solarRadiation: 4.63, avgTilt: 27, avgAzimuth: 180, avgShading: 17 },
  
  // Alaska
  AK: { state: "Alaska", stateCode: "AK", peakSunHours: 3.0, annualSunHours: 1095, solarRadiation: 2.93, avgTilt: 40, avgAzimuth: 180, avgShading: 25 },
};

/**
 * Get peak sun hours for a given state code
 * Falls back to US average if state not found
 */
export function getPeakSunHours(stateCode: string | undefined): number {
  if (!stateCode) {
    return 4.5; // US average fallback
  }
  
  const stateData = STATE_SUN_HOURS[stateCode.toUpperCase()];
  return stateData?.peakSunHours || 4.5;
}

/**
 * Get state-specific fallback roof characteristics
 * Used when Google Solar API is unavailable
 */
export function getStateFallbackRoofData(stateCode: string | undefined) {
  const defaultFallback = {
    tilt: 25,
    azimuth: 180,
    shading: 15,
    source: 'us_average' as const
  };
  
  if (!stateCode) {
    return defaultFallback;
  }
  
  const stateData = STATE_SUN_HOURS[stateCode.toUpperCase()];
  if (!stateData) {
    return defaultFallback;
  }
  
  return {
    tilt: stateData.avgTilt,
    azimuth: stateData.avgAzimuth,
    shading: stateData.avgShading,
    source: 'state_average' as const,
    stateName: stateData.state
  };
}

/**
 * Get full sun hours data for a state
 */
export function getStateSunData(stateCode: string | undefined): StateSunHours | null {
  if (!stateCode) return null;
  return STATE_SUN_HOURS[stateCode.toUpperCase()] || null;
}

/**
 * Get solar radiation (kWh/m²/day) for a state
 * Used in energy production calculations
 */
export function getSolarRadiation(stateCode: string | undefined): number {
  if (!stateCode) {
    return 4.5; // US average
  }
  
  const stateData = STATE_SUN_HOURS[stateCode.toUpperCase()];
  return stateData?.solarRadiation || 4.5;
}
