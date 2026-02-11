/**
 * Dashboard Utilities
 * Filtering, searching, sorting, and export functionality for leads list
 */

import type { Lead, CalculatorForm } from '../../../types';
import { BASE_ELECTRICITY_RATE, AVG_PRODUCTION_PER_KW } from '../calculations/solar';

/**
 * Filter options for leads dashboard
 */
export interface LeadFilters {
  creditScoreBracket?: 'Poor' | 'Fair' | 'Good' | 'Good+' | 'Very Good' | 'Excellent';
  financingType?: 'cash' | 'loan' | 'lease' | 'ppa';
  state?: string;
  systemSizeRange?: {
    min: number;
    max: number;
  };
  leadScoreRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
  wantsBattery?: boolean;
  timelinePreference?: 'immediate' | '3-months' | '6-months' | '12-months';
}

/**
 * Sort options for leads dashboard
 */
export type LeadSortField =
  | 'created_at'
  | 'lead_score'
  | 'creditScore'
  | 'systemSize'
  | 'systemCost'
  | 'estimatedAnnualProduction'
  | 'name'
  | 'state';

export interface LeadSort {
  field: LeadSortField;
  direction: 'asc' | 'desc';
}

/**
 * Get credit score bracket
 */
export function getCreditScoreBracket(creditScore: number): string {
  if (creditScore >= 800) return 'Excellent';
  if (creditScore >= 750) return 'Very Good';
  if (creditScore >= 700) return 'Good+';
  if (creditScore >= 650) return 'Good';
  if (creditScore >= 550) return 'Fair';
  return 'Poor';
}

/**
 * Search leads by name or email
 */
export function searchLeads(leads: Lead[], query: string): Lead[] {
  if (!query.trim()) return leads;

  const lowerQuery = query.toLowerCase();
  return leads.filter((lead) => {
    const name = lead.contact.name.toLowerCase();
    const email = lead.contact.email.toLowerCase();
    const phone = lead.contact.phone.toLowerCase();
    const street = lead.address.street.toLowerCase();
    const city = lead.address.city.toLowerCase();

    return (
      name.includes(lowerQuery) ||
      email.includes(lowerQuery) ||
      phone.includes(lowerQuery) ||
      street.includes(lowerQuery) ||
      city.includes(lowerQuery)
    );
  });
}

/**
 * Filter leads by criteria
 */
export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  return leads.filter((lead) => {
    // Credit score bracket filter
    if (filters.creditScoreBracket) {
      const creditScore = lead.preferences.creditScore || 700;
      const bracket = getCreditScoreBracket(creditScore);
      if (bracket !== filters.creditScoreBracket) return false;
    }

    // Financing type filter
    if (filters.financingType) {
      if (lead.preferences.financingType !== filters.financingType) return false;
    }

    // State filter
    if (filters.state) {
      if (lead.address.state.toUpperCase() !== filters.state.toUpperCase()) return false;
    }

    // System size range filter (estimated)
    if (filters.systemSizeRange) {
      // Estimate system size from usage
      const monthlyKwh = lead.usage.monthlyKwh || lead.usage.billAmount! / BASE_ELECTRICITY_RATE;
      const estimatedSystemSize = monthlyKwh * 12 * 0.8 / AVG_PRODUCTION_PER_KW;
      if (estimatedSystemSize < filters.systemSizeRange.min || estimatedSystemSize > filters.systemSizeRange.max) {
        return false;
      }
    }

    // Lead score range filter
    if (filters.leadScoreRange) {
      if (lead.lead_score < filters.leadScoreRange.min || lead.lead_score > filters.leadScoreRange.max) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const leadDate = new Date(lead.created_at);
      if (leadDate < filters.dateRange.from || leadDate > filters.dateRange.to) {
        return false;
      }
    }

    // Battery filter
    if (filters.wantsBattery !== undefined) {
      if (lead.preferences.wantsBattery !== filters.wantsBattery) return false;
    }

    // Timeline filter
    if (filters.timelinePreference) {
      if (lead.preferences.timeline !== filters.timelinePreference) return false;
    }

    return true;
  });
}

/**
 * Sort leads by field and direction
 */
export function sortLeads(leads: Lead[], sort: LeadSort): Lead[] {
  const sorted = [...leads];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sort.field) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;

      case 'lead_score':
        aValue = a.lead_score;
        bValue = b.lead_score;
        break;

      case 'creditScore':
        aValue = a.preferences.creditScore || 700;
        bValue = b.preferences.creditScore || 700;
        break;

      case 'systemSize':
        // Estimated from usage
        aValue = a.usage.monthlyKwh || a.usage.billAmount! / BASE_ELECTRICITY_RATE;
        bValue = b.usage.monthlyKwh || b.usage.billAmount! / BASE_ELECTRICITY_RATE;
        break;

      case 'estimatedAnnualProduction':
        // Estimated annual production
        const aMonthly = a.usage.monthlyKwh || a.usage.billAmount! / BASE_ELECTRICITY_RATE;
        const bMonthly = b.usage.monthlyKwh || b.usage.billAmount! / BASE_ELECTRICITY_RATE;
        aValue = aMonthly * 12 * 0.8;
        bValue = bMonthly * 12 * 0.8;
        break;

      case 'name':
        aValue = a.contact.name.toLowerCase();
        bValue = b.contact.name.toLowerCase();
        break;

      case 'state':
        aValue = a.address.state.toUpperCase();
        bValue = b.address.state.toUpperCase();
        break;

      default:
        return 0;
    }

    if (sort.direction === 'asc') {
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
    } else {
      if (aValue < bValue) return 1;
      if (aValue > bValue) return -1;
    }

    return 0;
  });

  return sorted;
}

/**
 * Get available filter options from leads
 */
export function getAvailableFilters(leads: Lead[]) {
  const creditBrackets = new Set<string>();
  const financingTypes = new Set<string>();
  const states = new Set<string>();
  let minScore = 100;
  let maxScore = 0;
  let minSystemSize = Infinity;
  let maxSystemSize = 0;
  let minProduction = Infinity;
  let maxProduction = 0;

  leads.forEach((lead) => {
    // Credit bracket
    const creditScore = lead.preferences.creditScore || 700;
    creditBrackets.add(getCreditScoreBracket(creditScore));

    // Financing type
    financingTypes.add(lead.preferences.financingType);

    // State
    states.add(lead.address.state);

    // Score range
    if (lead.lead_score < minScore) minScore = lead.lead_score;
    if (lead.lead_score > maxScore) maxScore = lead.lead_score;

    // System size range
    const monthlyKwh = lead.usage.monthlyKwh || lead.usage.billAmount! / BASE_ELECTRICITY_RATE;
    const systemSize = monthlyKwh * 12 * 0.8 / AVG_PRODUCTION_PER_KW;
    if (systemSize < minSystemSize) minSystemSize = systemSize;
    if (systemSize > maxSystemSize) maxSystemSize = systemSize;

    // Production range
    const annualProduction = monthlyKwh * 12 * 0.8;
    if (annualProduction < minProduction) minProduction = annualProduction;
    if (annualProduction > maxProduction) maxProduction = annualProduction;
  });

  return {
    creditBrackets: Array.from(creditBrackets).sort(),
    financingTypes: Array.from(financingTypes).sort(),
    states: Array.from(states).sort(),
    scoreRange: {
      min: Math.floor(minScore),
      max: Math.ceil(maxScore),
    },
    systemSizeRange: {
      min: Math.floor(minSystemSize),
      max: Math.ceil(maxSystemSize),
    },
    productionRange: {
      min: Math.floor(minProduction),
      max: Math.ceil(maxProduction),
    },
  };
}

/**
 * Export leads to CSV
 */
export function exportLeadsToCSV(leads: Lead[]): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Address',
    'City',
    'State',
    'ZIP',
    'Monthly kWh',
    'Bill Amount',
    'Roof Type',
    'Roof Sq Ft',
    'Sun Exposure',
    'Wants Battery',
    'Financing Type',
    'Credit Score',
    'Timeline',
    'Lead Score',
    'Created Date',
  ];

  const rows = leads.map((lead) => [
    lead.contact.name,
    lead.contact.email,
    lead.contact.phone,
    lead.address.street,
    lead.address.city,
    lead.address.state,
    lead.address.zip,
    lead.usage.monthlyKwh || '',
    lead.usage.billAmount || '',
    lead.roof.roofType,
    lead.roof.squareFeet,
    lead.roof.sunExposure,
    lead.preferences.wantsBattery ? 'Yes' : 'No',
    lead.preferences.financingType,
    lead.preferences.creditScore || '700',
    lead.preferences.timeline,
    lead.lead_score.toFixed(2),
    new Date(lead.created_at).toLocaleDateString(),
  ]);

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  return csv;
}

/**
 * Export leads to JSON
 */
export function exportLeadsToJSON(leads: Lead[]): string {
  return JSON.stringify(leads, null, 2);
}

/**
 * Export leads summary
 */
export function exportLeadsSummary(leads: Lead[]): string {
  const total = leads.length;
  const byFinancing = {
    cash: leads.filter((l) => l.preferences.financingType === 'cash').length,
    loan: leads.filter((l) => l.preferences.financingType === 'loan').length,
    lease: leads.filter((l) => l.preferences.financingType === 'lease').length,
    ppa: leads.filter((l) => l.preferences.financingType === 'ppa').length,
  };

  const byCreditScore = {
    poor: leads.filter((l) => getCreditScoreBracket(l.preferences.creditScore || 700) === 'Poor').length,
    fair: leads.filter((l) => getCreditScoreBracket(l.preferences.creditScore || 700) === 'Fair').length,
    good: leads.filter((l) => getCreditScoreBracket(l.preferences.creditScore || 700) === 'Good').length,
    goodPlus: leads.filter((l) => getCreditScoreBracket(l.preferences.creditScore || 700) === 'Good+').length,
    veryGood: leads.filter((l) => getCreditScoreBracket(l.preferences.creditScore || 700) === 'Very Good').length,
    excellent: leads.filter((l) => getCreditScoreBracket(l.preferences.creditScore || 700) === 'Excellent')
      .length,
  };

  const avgScore = leads.length > 0 ? leads.reduce((sum, l) => sum + l.lead_score, 0) / leads.length : 0;
  const avgCreditScore = leads.length > 0
    ? leads.reduce((sum, l) => sum + (l.preferences.creditScore || 700), 0) / leads.length
    : 0;

  return JSON.stringify(
    {
      summary: {
        total,
        averageLeadScore: avgScore.toFixed(2),
        averageCreditScore: Math.round(avgCreditScore),
      },
      byFinancingType: byFinancing,
      byCreditScoreBracket: byCreditScore,
    },
    null,
    2
  );
}

/**
 * Escape CSV values
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';

  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Get dashboard statistics
 */
export function getDashboardStatistics(leads: Lead[]) {
  const total = leads.length;
  const avgLeadScore = total > 0 ? leads.reduce((sum, l) => sum + l.lead_score, 0) / total : 0;
  const avgCreditScore = total > 0
    ? leads.reduce((sum, l) => sum + (l.preferences.creditScore || 700), 0) / total
    : 0;

  const byFinancing = {
    cash: leads.filter((l) => l.preferences.financingType === 'cash').length,
    loan: leads.filter((l) => l.preferences.financingType === 'loan').length,
    lease: leads.filter((l) => l.preferences.financingType === 'lease').length,
    ppa: leads.filter((l) => l.preferences.financingType === 'ppa').length,
  };

  const byState = leads.reduce(
    (acc, lead) => {
      const state = lead.address.state;
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const batteryInterest = leads.filter((l) => l.preferences.wantsBattery).length;
  const batteryPercentage = total > 0 ? ((batteryInterest / total) * 100).toFixed(1) : '0';

  const highScoreLeads = leads.filter((l) => l.lead_score >= 70).length;
  const qualityPercentage = total > 0 ? ((highScoreLeads / total) * 100).toFixed(1) : '0';

  return {
    totalLeads: total,
    averageLeadScore: Math.round(avgLeadScore * 100) / 100,
    averageCreditScore: Math.round(avgCreditScore),
    byFinancingType: byFinancing,
    byState,
    batteryInterest: {
      count: batteryInterest,
      percentage: parseFloat(batteryPercentage),
    },
    qualityLeads: {
      count: highScoreLeads,
      percentage: parseFloat(qualityPercentage),
    },
  };
}

/**
 * Get top leads by metric
 */
export function getTopLeads(
  leads: Lead[],
  metric: 'score' | 'creditScore' | 'systemSize' | 'estimatedProduction',
  count: number = 10
): Lead[] {
  const sorted = [...leads];

  sorted.sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (metric) {
      case 'score':
        aValue = a.lead_score;
        bValue = b.lead_score;
        break;
      case 'creditScore':
        aValue = a.preferences.creditScore || 700;
        bValue = b.preferences.creditScore || 700;
        break;
      case 'systemSize':
        aValue = a.usage.monthlyKwh || a.usage.billAmount! / BASE_ELECTRICITY_RATE;
        bValue = b.usage.monthlyKwh || b.usage.billAmount! / BASE_ELECTRICITY_RATE;
        break;
      case 'estimatedProduction':
        const aMonthly = a.usage.monthlyKwh || a.usage.billAmount! / BASE_ELECTRICITY_RATE;
        const bMonthly = b.usage.monthlyKwh || b.usage.billAmount! / BASE_ELECTRICITY_RATE;
        aValue = aMonthly * 12 * 0.8;
        bValue = bMonthly * 12 * 0.8;
        break;
      default:
        return 0;
    }

    return bValue - aValue;
  });

  return sorted.slice(0, count);
}

/**
 * Group leads by criteria
 */
export function groupLeads(leads: Lead[], groupBy: 'state' | 'financing' | 'creditScore' | 'timeline') {
  const groups: Record<string, Lead[]> = {};

  leads.forEach((lead) => {
    let key: string;

    switch (groupBy) {
      case 'state':
        key = lead.address.state;
        break;
      case 'financing':
        key = lead.preferences.financingType;
        break;
      case 'creditScore':
        key = getCreditScoreBracket(lead.preferences.creditScore || 700);
        break;
      case 'timeline':
        key = lead.preferences.timeline;
        break;
      default:
        key = 'other';
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(lead);
  });

  return groups;
}
