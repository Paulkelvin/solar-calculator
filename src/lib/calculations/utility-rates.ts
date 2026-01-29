/**
 * OpenEI Utility Rates API Integration
 * Fetches real electricity rates by location
 *
 * API Docs: https://openei.org/services/doc/rest/util_rates/
 */

interface OpenEIRate {
  residential_rate?: number;
  commercial_rate?: number;
  industrial_rate?: number;
  average_rate?: number;
}

/**
 * Fetch utility rates from OpenEI API
 * @param zipCode - Postal code for the property
 * @returns Average residential electricity rate ($/kWh)
 */
export async function fetchUtilityRate(zipCode: string): Promise<number | null> {
  try {
    const apiKey = process.env.OPENEI_API_KEY;
    if (!apiKey) {
      console.warn('OPENEI_API_KEY not configured - using default rate');
      return null;
    }

    // First, get utility info for the zip code
    const utilityUrl = new URL('https://api.openei.org/utility');
    utilityUrl.searchParams.set('zip', zipCode);
    utilityUrl.searchParams.set('api_key', apiKey);

    const utilityResponse = await fetch(utilityUrl.toString());
    if (!utilityResponse.ok) {
      console.warn('OpenEI utility lookup failed:', utilityResponse.status);
      return null;
    }

    const utilityData = await utilityResponse.json();
    if (!utilityData.utilities || utilityData.utilities.length === 0) {
      console.warn('No utilities found for zip code:', zipCode);
      return null;
    }

    // Get the first utility
    const utility = utilityData.utilities[0];
    const utilityName = utility.name || utility.utility;

    // Now fetch rates for this utility
    const rateUrl = new URL('https://api.openei.org/utility/rates');
    rateUrl.searchParams.set('util', utilityName);
    rateUrl.searchParams.set('zip', zipCode);
    rateUrl.searchParams.set('api_key', apiKey);
    rateUrl.searchParams.set('format', 'json');

    const rateResponse = await fetch(rateUrl.toString());
    if (!rateResponse.ok) {
      console.warn('OpenEI rate lookup failed:', rateResponse.status);
      return null;
    }

    const rateData = await rateResponse.json();

    // Extract residential rate
    if (rateData.items && rateData.items.length > 0) {
      const rate = rateData.items[0];

      // Try to find residential rate
      if (rate.rate && typeof rate.rate === 'number') {
        return rate.rate;
      }
    }

    return null;
  } catch (error) {
    console.error('OpenEI API error:', error);
    return null;
  }
}

/**
 * Get default utility rates by state
 * Based on EIA average rates
 */
export function getDefaultUtilityRate(state: string): number {
  const stateRates: Record<string, number> = {
    AL: 0.1254,
    AK: 0.2195,
    AZ: 0.1298,
    AR: 0.1046,
    CA: 0.1756,
    CO: 0.1287,
    CT: 0.2283,
    DE: 0.1389,
    FL: 0.1205,
    GA: 0.1196,
    HI: 0.2867,
    ID: 0.0893,
    IL: 0.1393,
    IN: 0.1247,
    IA: 0.1268,
    KS: 0.1266,
    KY: 0.1098,
    LA: 0.1039,
    ME: 0.1494,
    MD: 0.1426,
    MA: 0.1487,
    MI: 0.1556,
    MN: 0.1233,
    MS: 0.1097,
    MO: 0.1177,
    MT: 0.1038,
    NE: 0.1239,
    NV: 0.1269,
    NH: 0.1848,
    NJ: 0.1545,
    NM: 0.1131,
    NY: 0.1896,
    NC: 0.1209,
    ND: 0.1132,
    OH: 0.1319,
    OK: 0.1069,
    OR: 0.1221,
    PA: 0.1381,
    RI: 0.1617,
    SC: 0.1246,
    SD: 0.1195,
    TN: 0.1171,
    TX: 0.1258,
    UT: 0.1094,
    VT: 0.1757,
    VA: 0.1257,
    WA: 0.1223,
    WV: 0.1191,
    WI: 0.1361,
    WY: 0.1153,
  };

  return stateRates[state.toUpperCase()] || 0.14; // Default $0.14/kWh
}

/**
 * Calculate annual electricity costs
 * @param annualKwh - Annual electricity usage in kWh
 * @param ratePerKwh - Electricity rate in $/kWh
 * @returns Annual cost in dollars
 */
export function calculateAnnualElectricityCost(annualKwh: number, ratePerKwh: number): number {
  return Math.round(annualKwh * ratePerKwh);
}

/**
 * Calculate monthly electricity costs
 * @param monthlyKwh - Monthly electricity usage in kWh (array of 12 months)
 * @param ratePerKwh - Electricity rate in $/kWh
 * @returns Array of monthly costs in dollars
 */
export function calculateMonthlyElectricityCosts(
  monthlyKwh: number[],
  ratePerKwh: number
): number[] {
  return monthlyKwh.map((kwh) => Math.round(kwh * ratePerKwh));
}
