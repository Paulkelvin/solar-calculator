import { describe, it, expect } from 'vitest';
import {
  getCreditScoreBracket,
  searchLeads,
  filterLeads,
  sortLeads,
  getAvailableFilters,
  exportLeadsToCSV,
  exportLeadsToJSON,
  exportLeadsSummary,
  getDashboardStatistics,
  getTopLeads,
  groupLeads,
} from '../src/lib/dashboard/leads-utils';
import type { Lead } from '../types';

// Mock leads for testing
function createMockLead(overrides?: Partial<Lead>): Lead {
  return {
    id: 'lead-1',
    installer_id: 'installer-1',
    address: {
      street: '123 Main St',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
    usage: {
      monthlyKwh: 900,
    },
    roof: {
      roofType: 'asphalt',
      squareFeet: 2500,
      sunExposure: 'good',
    },
    preferences: {
      wantsBattery: false,
      financingType: 'loan',
      creditScore: 700,
      timeline: '3-months',
      notes: '',
    },
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '3035551234',
    },
    lead_score: 75,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('Dashboard Utilities', () => {
  describe('Credit Score Bracket', () => {
    it('should map 300-549 to Poor', () => {
      expect(getCreditScoreBracket(300)).toBe('Poor');
      expect(getCreditScoreBracket(500)).toBe('Poor');
      expect(getCreditScoreBracket(549)).toBe('Poor');
    });

    it('should map 550-649 to Fair', () => {
      expect(getCreditScoreBracket(550)).toBe('Fair');
      expect(getCreditScoreBracket(600)).toBe('Fair');
      expect(getCreditScoreBracket(649)).toBe('Fair');
    });

    it('should map 650-699 to Good', () => {
      expect(getCreditScoreBracket(650)).toBe('Good');
      expect(getCreditScoreBracket(675)).toBe('Good');
      expect(getCreditScoreBracket(699)).toBe('Good');
    });

    it('should map 700-749 to Good+', () => {
      expect(getCreditScoreBracket(700)).toBe('Good+');
      expect(getCreditScoreBracket(725)).toBe('Good+');
      expect(getCreditScoreBracket(749)).toBe('Good+');
    });

    it('should map 750-799 to Very Good', () => {
      expect(getCreditScoreBracket(750)).toBe('Very Good');
      expect(getCreditScoreBracket(775)).toBe('Very Good');
      expect(getCreditScoreBracket(799)).toBe('Very Good');
    });

    it('should map 800-850 to Excellent', () => {
      expect(getCreditScoreBracket(800)).toBe('Excellent');
      expect(getCreditScoreBracket(825)).toBe('Excellent');
      expect(getCreditScoreBracket(850)).toBe('Excellent');
    });
  });

  describe('Search Leads', () => {
    it('should find leads by name', () => {
      const leads = [
        createMockLead({ contact: { name: 'John Doe', email: 'john@example.com', phone: '3035551234' } }),
        createMockLead({ contact: { name: 'Jane Smith', email: 'jane@example.com', phone: '3035555678' } }),
      ];

      const results = searchLeads(leads, 'John');
      expect(results).toHaveLength(1);
      expect(results[0].contact.name).toBe('John Doe');
    });

    it('should find leads by email', () => {
      const leads = [
        createMockLead({ contact: { name: 'John Doe', email: 'john@example.com', phone: '3035551234' } }),
        createMockLead({ contact: { name: 'Jane Smith', email: 'jane@example.com', phone: '3035555678' } }),
      ];

      const results = searchLeads(leads, 'jane');
      expect(results).toHaveLength(1);
      expect(results[0].contact.email).toBe('jane@example.com');
    });

    it('should find leads by phone', () => {
      const leads = [
        createMockLead({ contact: { name: 'John Doe', email: 'john@example.com', phone: '3035551234' } }),
        createMockLead({ contact: { name: 'Jane Smith', email: 'jane@example.com', phone: '3035555678' } }),
      ];

      const results = searchLeads(leads, '303555');
      expect(results).toHaveLength(2);
    });

    it('should find leads by city', () => {
      const leads = [
        createMockLead({ address: { street: '123 Main', city: 'Denver', state: 'CO', zip: '80202' } }),
        createMockLead({ address: { street: '456 Oak', city: 'Boulder', state: 'CO', zip: '80305' } }),
      ];

      const results = searchLeads(leads, 'Denver');
      expect(results).toHaveLength(1);
      expect(results[0].address.city).toBe('Denver');
    });

    it('should return empty results for no matches', () => {
      const leads = [createMockLead()];
      const results = searchLeads(leads, 'NonExistent');
      expect(results).toHaveLength(0);
    });

    it('should return all leads for empty query', () => {
      const leads = [createMockLead(), createMockLead({ id: 'lead-2' })];
      const results = searchLeads(leads, '');
      expect(results).toHaveLength(2);
    });
  });

  describe('Filter Leads', () => {
    it('should filter by credit score bracket', () => {
      const leads = [
        createMockLead({ preferences: { creditScore: 500 } }),
        createMockLead({ id: 'lead-2', preferences: { creditScore: 750 } }),
      ];

      const results = filterLeads(leads, { creditScoreBracket: 'Poor' });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('lead-1');
    });

    it('should filter by financing type', () => {
      const leads = [
        createMockLead({ preferences: { financingType: 'cash' } }),
        createMockLead({ id: 'lead-2', preferences: { financingType: 'loan' } }),
      ];

      const results = filterLeads(leads, { financingType: 'loan' });
      expect(results).toHaveLength(1);
      expect(results[0].preferences.financingType).toBe('loan');
    });

    it('should filter by state', () => {
      const leads = [
        createMockLead({ address: { street: '123 Main', city: 'Denver', state: 'CO', zip: '80202' } }),
        createMockLead({ id: 'lead-2', address: { street: '456 Main', city: 'NYC', state: 'NY', zip: '10001' } }),
      ];

      const results = filterLeads(leads, { state: 'CO' });
      expect(results).toHaveLength(1);
      expect(results[0].address.state).toBe('CO');
    });

    it('should filter by battery preference', () => {
      const leads = [
        createMockLead({ preferences: { wantsBattery: true } }),
        createMockLead({ id: 'lead-2', preferences: { wantsBattery: false } }),
      ];

      const results = filterLeads(leads, { wantsBattery: true });
      expect(results).toHaveLength(1);
      expect(results[0].preferences.wantsBattery).toBe(true);
    });

    it('should filter by timeline', () => {
      const leads = [
        createMockLead({ preferences: { timeline: 'immediate' } }),
        createMockLead({ id: 'lead-2', preferences: { timeline: '6-months' } }),
      ];

      const results = filterLeads(leads, { timelinePreference: '6-months' });
      expect(results).toHaveLength(1);
      expect(results[0].preferences.timeline).toBe('6-months');
    });

    it('should apply multiple filters', () => {
      const leads = [
        createMockLead({
          preferences: { creditScore: 750, financingType: 'loan' },
          address: { street: '123 Main', city: 'Denver', state: 'CO', zip: '80202' },
        }),
        createMockLead({
          id: 'lead-2',
          preferences: { creditScore: 600, financingType: 'cash' },
          address: { street: '456 Main', city: 'Denver', state: 'CO', zip: '80202' },
        }),
      ];

      const results = filterLeads(leads, {
        state: 'CO',
        creditScoreBracket: 'Very Good',
        financingType: 'loan',
      });
      expect(results).toHaveLength(1);
      expect(results[0].preferences.creditScore).toBe(750);
    });
  });

  describe('Sort Leads', () => {
    it('should sort by created date ascending', () => {
      const date1 = new Date('2025-01-01').toISOString();
      const date2 = new Date('2025-01-02').toISOString();

      const leads = [
        createMockLead({ created_at: date2 }),
        createMockLead({ id: 'lead-2', created_at: date1 }),
      ];

      const results = sortLeads(leads, { field: 'created_at', direction: 'asc' });
      expect(results[0].created_at).toBe(date1);
      expect(results[1].created_at).toBe(date2);
    });

    it('should sort by lead score descending', () => {
      const leads = [
        createMockLead({ lead_score: 50 }),
        createMockLead({ id: 'lead-2', lead_score: 80 }),
      ];

      const results = sortLeads(leads, { field: 'lead_score', direction: 'desc' });
      expect(results[0].lead_score).toBe(80);
      expect(results[1].lead_score).toBe(50);
    });

    it('should sort by credit score', () => {
      const leads = [
        createMockLead({ preferences: { creditScore: 700 } }),
        createMockLead({ id: 'lead-2', preferences: { creditScore: 600 } }),
      ];

      const results = sortLeads(leads, { field: 'creditScore', direction: 'asc' });
      expect(results[0].preferences.creditScore).toBe(600);
      expect(results[1].preferences.creditScore).toBe(700);
    });

    it('should sort by name', () => {
      const leads = [
        createMockLead({ contact: { name: 'Zebra', email: 'z@example.com', phone: '3035551234' } }),
        createMockLead({ id: 'lead-2', contact: { name: 'Apple', email: 'a@example.com', phone: '3035551234' } }),
      ];

      const results = sortLeads(leads, { field: 'name', direction: 'asc' });
      expect(results[0].contact.name).toBe('Apple');
      expect(results[1].contact.name).toBe('Zebra');
    });

    it('should sort by state', () => {
      const leads = [
        createMockLead({ address: { street: '123 Main', city: 'NYC', state: 'NY', zip: '10001' } }),
        createMockLead({ id: 'lead-2', address: { street: '456 Main', city: 'Denver', state: 'CO', zip: '80202' } }),
      ];

      const results = sortLeads(leads, { field: 'state', direction: 'asc' });
      expect(results[0].address.state).toBe('CO');
      expect(results[1].address.state).toBe('NY');
    });
  });

  describe('Get Available Filters', () => {
    it('should return available credit brackets', () => {
      const leads = [
        createMockLead({ preferences: { creditScore: 500 } }),
        createMockLead({ id: 'lead-2', preferences: { creditScore: 750 } }),
      ];

      const filters = getAvailableFilters(leads);
      expect(filters.creditBrackets).toContain('Poor');
      expect(filters.creditBrackets).toContain('Very Good');
    });

    it('should return available financing types', () => {
      const leads = [
        createMockLead({ preferences: { financingType: 'cash' } }),
        createMockLead({ id: 'lead-2', preferences: { financingType: 'loan' } }),
      ];

      const filters = getAvailableFilters(leads);
      expect(filters.financingTypes).toContain('cash');
      expect(filters.financingTypes).toContain('loan');
    });

    it('should return available states', () => {
      const leads = [
        createMockLead({ address: { street: '123 Main', city: 'Denver', state: 'CO', zip: '80202' } }),
        createMockLead({ id: 'lead-2', address: { street: '456 Main', city: 'NYC', state: 'NY', zip: '10001' } }),
      ];

      const filters = getAvailableFilters(leads);
      expect(filters.states).toContain('CO');
      expect(filters.states).toContain('NY');
    });

    it('should calculate score range', () => {
      const leads = [
        createMockLead({ lead_score: 50 }),
        createMockLead({ id: 'lead-2', lead_score: 90 }),
      ];

      const filters = getAvailableFilters(leads);
      expect(filters.scoreRange.min).toBe(50);
      expect(filters.scoreRange.max).toBe(90);
    });
  });

  describe('Export Functionality', () => {
    it('should export leads to CSV', () => {
      const leads = [
        createMockLead({
          contact: { name: 'John Doe', email: 'john@example.com', phone: '3035551234' },
          lead_score: 75,
        }),
      ];

      const csv = exportLeadsToCSV(leads);
      expect(csv).toContain('Name');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('john@example.com');
    });

    it('should export leads to JSON', () => {
      const leads = [createMockLead()];
      const json = exportLeadsToJSON(leads);
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].contact.name).toBe('John Doe');
    });

    it('should export leads summary', () => {
      const leads = [
        createMockLead({ preferences: { financingType: 'cash' } }),
        createMockLead({ id: 'lead-2', preferences: { financingType: 'loan' } }),
      ];

      const summary = exportLeadsSummary(leads);
      const parsed = JSON.parse(summary);
      expect(parsed.summary.total).toBe(2);
      expect(parsed.byFinancingType.cash).toBe(1);
      expect(parsed.byFinancingType.loan).toBe(1);
    });

    it('should handle CSV with special characters', () => {
      const leads = [
        createMockLead({
          contact: { name: 'John "The" Doe', email: 'john@example.com', phone: '3035551234' },
        }),
      ];

      const csv = exportLeadsToCSV(leads);
      expect(csv).toContain('"John ""The"" Doe"');
    });
  });

  describe('Dashboard Statistics', () => {
    it('should calculate total leads', () => {
      const leads = [createMockLead(), createMockLead({ id: 'lead-2' })];
      const stats = getDashboardStatistics(leads);
      expect(stats.totalLeads).toBe(2);
    });

    it('should calculate average lead score', () => {
      const leads = [
        createMockLead({ lead_score: 60 }),
        createMockLead({ id: 'lead-2', lead_score: 80 }),
      ];

      const stats = getDashboardStatistics(leads);
      expect(stats.averageLeadScore).toBe(70);
    });

    it('should count leads by financing type', () => {
      const leads = [
        createMockLead({ preferences: { financingType: 'cash' } }),
        createMockLead({ id: 'lead-2', preferences: { financingType: 'cash' } }),
        createMockLead({ id: 'lead-3', preferences: { financingType: 'loan' } }),
      ];

      const stats = getDashboardStatistics(leads);
      expect(stats.byFinancingType.cash).toBe(2);
      expect(stats.byFinancingType.loan).toBe(1);
    });

    it('should count battery interest', () => {
      const leads = [
        createMockLead({ preferences: { wantsBattery: true } }),
        createMockLead({ id: 'lead-2', preferences: { wantsBattery: false } }),
      ];

      const stats = getDashboardStatistics(leads);
      expect(stats.batteryInterest.count).toBe(1);
      expect(stats.batteryInterest.percentage).toBe(50);
    });

    it('should count quality leads (score >= 70)', () => {
      const leads = [
        createMockLead({ lead_score: 75 }),
        createMockLead({ id: 'lead-2', lead_score: 65 }),
      ];

      const stats = getDashboardStatistics(leads);
      expect(stats.qualityLeads.count).toBe(1);
      expect(stats.qualityLeads.percentage).toBe(50);
    });
  });

  describe('Top Leads', () => {
    it('should get top leads by score', () => {
      const leads = [
        createMockLead({ lead_score: 70 }),
        createMockLead({ id: 'lead-2', lead_score: 80 }),
        createMockLead({ id: 'lead-3', lead_score: 90 }),
      ];

      const top = getTopLeads(leads, 'score', 2);
      expect(top).toHaveLength(2);
      expect(top[0].lead_score).toBe(90);
      expect(top[1].lead_score).toBe(80);
    });

    it('should get top leads by credit score', () => {
      const leads = [
        createMockLead({ preferences: { creditScore: 600 } }),
        createMockLead({ id: 'lead-2', preferences: { creditScore: 800 } }),
      ];

      const top = getTopLeads(leads, 'creditScore', 1);
      expect(top).toHaveLength(1);
      expect(top[0].preferences.creditScore).toBe(800);
    });
  });

  describe('Group Leads', () => {
    it('should group leads by state', () => {
      const leads = [
        createMockLead({ address: { street: '123 Main', city: 'Denver', state: 'CO', zip: '80202' } }),
        createMockLead({ id: 'lead-2', address: { street: '456 Main', city: 'NYC', state: 'NY', zip: '10001' } }),
        createMockLead({ id: 'lead-3', address: { street: '789 Main', city: 'Boulder', state: 'CO', zip: '80305' } }),
      ];

      const groups = groupLeads(leads, 'state');
      expect(groups['CO']).toHaveLength(2);
      expect(groups['NY']).toHaveLength(1);
    });

    it('should group leads by financing type', () => {
      const leads = [
        createMockLead({ preferences: { financingType: 'cash' } }),
        createMockLead({ id: 'lead-2', preferences: { financingType: 'cash' } }),
        createMockLead({ id: 'lead-3', preferences: { financingType: 'loan' } }),
      ];

      const groups = groupLeads(leads, 'financing');
      expect(groups['cash']).toHaveLength(2);
      expect(groups['loan']).toHaveLength(1);
    });

    it('should group leads by credit score bracket', () => {
      const leads = [
        createMockLead({ preferences: { creditScore: 700 } }),
        createMockLead({ id: 'lead-2', preferences: { creditScore: 750 } }),
        createMockLead({ id: 'lead-3', preferences: { creditScore: 600 } }),
      ];

      const groups = groupLeads(leads, 'creditScore');
      expect(groups['Good+']).toHaveLength(1);
      expect(groups['Very Good']).toHaveLength(1);
      expect(groups['Fair']).toHaveLength(1);
    });

    it('should group leads by timeline', () => {
      const leads = [
        createMockLead({ preferences: { timeline: 'immediate' } }),
        createMockLead({ id: 'lead-2', preferences: { timeline: 'immediate' } }),
        createMockLead({ id: 'lead-3', preferences: { timeline: '6-months' } }),
      ];

      const groups = groupLeads(leads, 'timeline');
      expect(groups['immediate']).toHaveLength(2);
      expect(groups['6-months']).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty leads array', () => {
      const leads: Lead[] = [];
      expect(searchLeads(leads, 'test')).toHaveLength(0);
      expect(filterLeads(leads, {})).toHaveLength(0);
      expect(getDashboardStatistics(leads).totalLeads).toBe(0);
    });

    it('should handle case-insensitive search', () => {
      const leads = [createMockLead({ contact: { name: 'John DOE', email: 'john@example.com', phone: '3035551234' } })];
      const results = searchLeads(leads, 'john doe');
      expect(results).toHaveLength(1);
    });

    it('should handle leads with default credit score', () => {
      const leads = [createMockLead({ preferences: { creditScore: undefined as any } })];
      const stats = getDashboardStatistics(leads);
      expect(stats.averageCreditScore).toBe(700);
    });

    it('should sort maintains array stability', () => {
      const leads = [
        createMockLead({ id: 'lead-1', lead_score: 70 }),
        createMockLead({ id: 'lead-2', lead_score: 70 }),
      ];

      const results = sortLeads(leads, { field: 'lead_score', direction: 'asc' });
      expect(results).toHaveLength(2);
      expect(results[0].lead_score).toBe(70);
      expect(results[1].lead_score).toBe(70);
    });
  });
});
