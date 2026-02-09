/**
 * Solar Score Calculator
 * Fetches and calculates a user-friendly solar potential score from Google Solar API
 */

interface SolarScoreResult {
  solarScore: number; // 0-100
  peakSunHours: number;
  percentileRanking: number; // Top X% in region
  estimatedSavingsRange: { min: number; max: number };
  roofAreaSqft: number;
  sunExposurePercentage: number;
  shadingPercentage: number;
  maxPanels: number;
}

/**
 * Calculate solar score from coordinates
 * Calls Solar API and transforms data into a digestible score
 */
export async function calculateSolarScore(
  latitude: number,
  longitude: number,
  country: 'US' | 'Nigeria' = 'US'
): Promise<SolarScoreResult | null> {
  try {
    // Call Solar API proxy
    const response = await fetch('/api/google-solar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      console.error('Solar API error:', response.status);
      return null;
    }

    const data = await response.json();
    const roofSegments = data.roofSegments || [];
    const panelConfigs = data.panelConfigs || [];
    const bestConfig = panelConfigs[0];

    const annualKwh = bestConfig?.yearlyEnergyKwh || Math.round((roofSegments.length ? roofSegments.reduce((sum: number, seg: any) => sum + (seg.solarPotential || 0), 0) : 6000));
    const maxPanels = data.maxArrayPanels || (bestConfig?.panelsCount ?? Math.round((bestConfig?.systemSizeKw || 7.5) * 1000 / 400));
    const avgSunExposure = roofSegments.length > 0
      ? roofSegments.reduce((sum: number, seg: any) => sum + (seg.sunExposure ?? 75), 0) / roofSegments.length
      : 75;
    const roofScore = Math.round(Math.min(10, Math.max(1, avgSunExposure / 10)));

    // Calculate solar score (0-100)
    // Factors: annual potential (60%), roof quality (30%), max panels (10%)
    const potentialScore = Math.min((annualKwh / 12000) * 60, 60); // Up to 60 points
    const roofQualityScore = (roofScore / 10) * 30; // Up to 30 points
    const panelScore = Math.min((maxPanels / 20) * 10, 10); // Up to 10 points
    
    const solarScore = Math.round(potentialScore + roofQualityScore + panelScore);

    // Estimate peak sun hours (higher in southern latitudes)
    const peakSunHours = country === 'Nigeria' 
      ? 5.5 + Math.random() * 0.5 // 5.5-6 hours for Nigeria (equatorial)
      : 4.0 + Math.random() * 1.5; // 4-5.5 hours for US (varies)

    // Calculate percentile ranking (top X%)
    // Based on solar score: 85+ = top 10%, 70+ = top 25%, 55+ = top 50%
    let percentileRanking = 50;
    if (solarScore >= 85) percentileRanking = 10;
    else if (solarScore >= 70) percentileRanking = 25;
    else if (solarScore >= 55) percentileRanking = 50;
    else percentileRanking = 75;

    // Estimate annual savings
    // Nigeria: ₦50-80/kWh average, US: $0.12-0.18/kWh
    const rateMin = country === 'Nigeria' ? 50 : 0.12;
    const rateMax = country === 'Nigeria' ? 80 : 0.18;
    const estimatedSavingsMin = Math.round(annualKwh * 0.7 * rateMin);
    const estimatedSavingsMax = Math.round(annualKwh * 0.9 * rateMax);

    return {
      solarScore,
      peakSunHours: Math.round(peakSunHours * 10) / 10,
      percentileRanking,
      estimatedSavingsRange: {
        min: estimatedSavingsMin,
        max: estimatedSavingsMax,
      },
      roofAreaSqft: Math.round((data.wholeRoofArea || 200) * 10.764),
      sunExposurePercentage: Math.round(avgSunExposure),
      shadingPercentage: Math.max(0, 100 - Math.round(avgSunExposure)),
      maxPanels,
    };
  } catch (error) {
    console.error('Error calculating solar score:', error);
    return null;
  }
}
