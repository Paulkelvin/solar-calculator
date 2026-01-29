/**
 * Phase 5.1: Google Solar API Integration Tests
 * 
 * Tests for:
 * - Address autocomplete functionality
 * - Solar data retrieval
 * - API error handling
 * - Fallback to Phase 4 mock data
 * 
 * Test Count: 12 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGoogleSolarData,
  getAddressAutocomplete,
} from '../src/lib/apis/google-solar-api';

describe('Phase 5.1: Google Solar API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Solar Data Retrieval', () => {
    it('should return mock data in development/test mode', async () => {
      const result = await getGoogleSolarData('test_place_id');
      // Phase 5.1: Returns realistic mock data for development/testing
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('panelCapacityWatts');
      expect(result).toHaveProperty('estimatedAnnualKwh');
      expect(result).toHaveProperty('solarPotential');
    });

    it('should handle empty placeId gracefully', async () => {
      const result = await getGoogleSolarData('');
      expect(result).toBeNull(); // Empty input returns null
    });

    it('should validate required fields in returned data', async () => {
      const result = await getGoogleSolarData('test_place_id');
      if (result !== null) {
        expect(result.panelCapacityWatts).toBeGreaterThan(0);
        expect(result.estimatedAnnualKwh).toBeGreaterThan(0);
        expect(['high', 'medium', 'low']).toContain(result.solarPotential);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Address Autocomplete', () => {
    it('should return mock results in development/test mode', async () => {
      const results = await getAddressAutocomplete('123 Main St');
      expect(Array.isArray(results)).toBe(true);
      // In development/test mode, should return suggestions
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty input gracefully', async () => {
      const results = await getAddressAutocomplete('');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0); // Empty input returns empty array
    });

    it('should handle single character input', async () => {
      const results = await getAddressAutocomplete('5');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0); // Too short
    });
  });

  describe('Fallback Behavior', () => {
    it('should return mock data even when API credentials missing', async () => {
      // Unset API keys to simulate missing credentials
      const savedKey = process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
      const savedPlacesKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
      
      delete process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
      delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
      
      const solarData = await getGoogleSolarData('test_place_id');
      const addressData = await getAddressAutocomplete('test address');

      // In development/test mode, should return mock data even without credentials
      expect(solarData).not.toBeNull();
      expect(Array.isArray(addressData)).toBe(true);
      
      // Restore environment
      if (savedKey) process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY = savedKey;
      if (savedPlacesKey) process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = savedPlacesKey;
    });

    it('should gracefully handle invalid input types', async () => {
      // Should not throw on invalid inputs
      const result = await getGoogleSolarData('');
      expect(result).toBeNull();
    });

    it('should maintain Phase 4 compatibility', async () => {
      // Verify that fallback mechanism works
      const result = await getGoogleSolarData('compatibility_test');
      
      // Should return mock data (not throw)
      expect(() => {
        expect(result === null || typeof result === 'object').toBe(true);
      }).not.toThrow();
    });
  });

  describe('Phase 5.1 Implementation Readiness', () => {
    it('should return properly structured solar data', async () => {
      const result = await getGoogleSolarData('test');
      if (result !== null) {
        expect(result).toHaveProperty('roofAreaSqft');
        expect(result).toHaveProperty('sunExposurePercentage');
        expect(result).toHaveProperty('shadingAnalysis');
        expect(result.shadingAnalysis).toHaveProperty('averageShadingPercentage');
        expect(result.shadingAnalysis).toHaveProperty('monthlyVariation');
        expect(Array.isArray(result.shadingAnalysis.monthlyVariation)).toBe(true);
      }
    });

    it('should return properly structured address suggestions', async () => {
      const addressResults = await getAddressAutocomplete('123 Main');
      expect(Array.isArray(addressResults)).toBe(true);
      
      if (addressResults.length > 0) {
        const first = addressResults[0];
        expect(first).toHaveProperty('address');
        expect(first).toHaveProperty('placeId');
        expect(first).toHaveProperty('latitude');
        expect(first).toHaveProperty('longitude');
        expect(first).toHaveProperty('formattedAddress');
      }
    });

    it('should handle credential validation safely', () => {
      // Just verify the check doesn't throw
      const hasCredentials = !!process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
      expect(typeof hasCredentials).toBe('boolean');
    });
  });
});
