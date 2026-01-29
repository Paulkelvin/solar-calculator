/**
 * Enhanced Lead Scoring Service
 * Phase 5.2 Week 3: Real solar potential + incentives + financing
 * 
 * Replaces simple stub with data-driven scoring
 */

export interface LeadScoringFactors {
  // Solar metrics (0-30 points)
  solarPotential: 'high' | 'medium' | 'low';
  sunExposure: number; // 0-100%
  roofAreaSqft: number;
  systemSizeKw: number;

  // Economics (0-30 points)
  annualSavings: number; // $
  paybackYears: number;
  firstYearIncentives: number; // $
  roi25Year: number; // %

  // Financing (0-20 points)
  financingType: 'cash' | 'loan' | 'lease' | 'ppa';
  timeline: 'immediate' | '3-months' | '6-months' | '12-months' | 'flexible';

  // Lead quality (0-20 points)
  hasCoordinates: boolean;
  hasContact: boolean;
  completedAllSteps: boolean;
}

/**
 * Calculate solar potential score (0-30)
 * High quality solar sites score better
 */
function scoreSolarPotential(factors: LeadScoringFactors): number {
  let score = 0;

  // Base potential
  if (factors.solarPotential === 'high') score += 15;
  else if (factors.solarPotential === 'medium') score += 10;
  else score += 5;

  // Sun exposure bonus
  if (factors.sunExposure >= 85) score += 10;
  else if (factors.sunExposure >= 70) score += 7;
  else if (factors.sunExposure >= 50) score += 3;

  // Roof area (larger = better economics)
  if (factors.roofAreaSqft >= 3000) score += 5;
  else if (factors.roofAreaSqft >= 2000) score += 3;

  return Math.min(30, score);
}

/**
 * Calculate economic viability score (0-30)
 * Better savings and faster payback score higher
 */
function scoreEconomics(factors: LeadScoringFactors): number {
  let score = 0;

  // ROI is paramount
  if (factors.roi25Year >= 200) score += 15;
  else if (factors.roi25Year >= 150) score += 12;
  else if (factors.roi25Year >= 100) score += 9;
  else if (factors.roi25Year >= 50) score += 6;
  else score += 2;

  // Payback period
  if (factors.paybackYears <= 5) score += 10;
  else if (factors.paybackYears <= 7) score += 8;
  else if (factors.paybackYears <= 10) score += 5;
  else score += 2;

  // First year incentives (fast ROI boost)
  if (factors.firstYearIncentives >= 5000) score += 5;
  else if (factors.firstYearIncentives >= 2000) score += 3;

  return Math.min(30, score);
}

/**
 * Calculate financing score (0-20)
 * Certain financing methods have better close rates
 */
function scoreFinancing(factors: LeadScoringFactors): number {
  let score = 0;

  // Financing type (cash easiest to close)
  if (factors.financingType === 'cash') score += 12;
  else if (factors.financingType === 'loan') score += 8;
  else if (factors.financingType === 'ppa') score += 6;
  else if (factors.financingType === 'lease') score += 4;

  // Timeline (sooner = more likely to close)
  if (factors.timeline === 'immediate') score += 8;
  else if (factors.timeline === '3-months') score += 6;
  else if (factors.timeline === '6-months') score += 4;
  else if (factors.timeline === '12-months') score += 2;

  return Math.min(20, score);
}

/**
 * Calculate lead quality score (0-20)
 * Complete data = higher quality lead
 */
function scoreLeadQuality(factors: LeadScoringFactors): number {
  let score = 0;

  if (factors.hasCoordinates) score += 8;
  if (factors.hasContact) score += 8;
  if (factors.completedAllSteps) score += 4;

  return Math.min(20, score);
}

/**
 * Calculate overall lead score (0-100)
 * Combines all factors with weighted importance
 */
export function calculateEnhancedLeadScore(factors: LeadScoringFactors): number {
  const solarScore = scoreSolarPotential(factors);
  const economicsScore = scoreEconomics(factors);
  const financingScore = scoreFinancing(factors);
  const qualityScore = scoreLeadQuality(factors);

  const totalScore = solarScore + economicsScore + financingScore + qualityScore;

  return Math.round(totalScore);
}

/**
 * Get lead score tier for display
 */
export function getScoreTier(score: number): {
  tier: 'hot' | 'warm' | 'cool' | 'cold';
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      tier: 'hot',
      label: 'Hot Lead',
      color: '#ef4444', // red
      description: 'Excellent solar potential + high ROI + ready to buy'
    };
  }
  if (score >= 65) {
    return {
      tier: 'warm',
      label: 'Warm Lead',
      color: '#f97316', // orange
      description: 'Good solar potential + solid ROI + flexible timeline'
    };
  }
  if (score >= 50) {
    return {
      tier: 'cool',
      label: 'Cool Lead',
      color: '#eab308', // yellow
      description: 'Moderate solar potential + fair ROI + exploring options'
    };
  }
  return {
    tier: 'cold',
    label: 'Cold Lead',
    color: '#64748b', // slate
    description: 'Limited solar potential or unfavorable economics'
  };
}

/**
 * Explain what's driving the score
 */
export function explainScore(factors: LeadScoringFactors): string[] {
  const reasons: string[] = [];

  // Solar factors
  if (factors.solarPotential === 'high') {
    reasons.push(`✓ High solar potential (${factors.sunExposure}% sun exposure)`);
  } else if (factors.solarPotential === 'medium') {
    reasons.push(`◐ Medium solar potential (${factors.sunExposure}% sun exposure)`);
  } else {
    reasons.push(`✗ Low solar potential (${factors.sunExposure}% sun exposure)`);
  }

  // Economics
  if (factors.roi25Year >= 150) {
    reasons.push(`💰 Strong ROI (${factors.roi25Year}% over 25 years)`);
  }
  if (factors.paybackYears <= 7) {
    reasons.push(`⚡ Fast payback (~${factors.paybackYears.toFixed(1)} years)`);
  }
  if (factors.firstYearIncentives >= 3000) {
    reasons.push(`🎁 Significant incentives ($${factors.firstYearIncentives.toLocaleString()})`);
  }

  // Financing
  if (factors.financingType === 'cash') {
    reasons.push(`💳 Cash purchase (easier to close)`);
  } else if (factors.financingType === 'loan') {
    reasons.push(`📋 Loan financing (qualified buyer)`);
  }

  // Timeline
  if (factors.timeline === 'immediate' || factors.timeline === '3-months') {
    reasons.push(`⏰ Ready soon (${factors.timeline} timeline)`);
  }

  // Data quality
  if (factors.hasCoordinates && factors.hasContact && factors.completedAllSteps) {
    reasons.push(`✓ Complete lead info`);
  }

  return reasons;
}
