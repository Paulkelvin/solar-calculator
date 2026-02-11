/**
 * Global Calculator State Management with Zustand
 * Phase Enhancement: Psychology-driven user experience
 * 
 * Provides reactive state for:
 * - Form data across all steps
 * - Solar API data (score, potential)
 * - Live estimates and previews
 * - Adaptive flow decisions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface RoofSegment {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  area: number; // sq meters
  solarPotential: number; // annual kWh
  sunExposure: number; // 0-100%
  azimuth: number; // degrees
  tilt: number; // degrees
  center?: { latitude: number; longitude: number };
  footprint?: Array<{ latitude: number; longitude: number }>;
  footprintSource?: 'google_polygon' | 'rotated_bbox' | 'axis_bbox';
}

export interface SolarData {
  solarScore?: number; // 0-100 score
  peakSunHours?: number;
  percentileRanking?: number; // Top X% in region
  estimatedSavingsRange?: { min: number; max: number };
  roofAreaSqft?: number;
  sunExposurePercentage?: number;
  shadingPercentage?: number;
  optimalTilt?: number;
  optimalAzimuth?: number;
  maxPanels?: number;
  annualProduction?: number;
  // Google Solar canonical capacity — single source of truth for financial calculations
  panelCapacityWatts?: number; // Max system capacity from Google Solar (e.g. 7500 = 7.5kW)
  googleSolarSource?: 'real' | 'mock'; // Whether Google Solar returned real satellite data
  roofSegments?: RoofSegment[]; // Roof segments from Google Solar API
  roofCenter?: { latitude: number; longitude: number };
  roofOutline?: Array<{ latitude: number; longitude: number }>;
  roofOutlineSource?: 'union' | 'synthetic' | 'google_polygon' | 'rotated_bbox' | 'axis_bbox';
  dataSource?: 'google_solar_api' | 'state_average' | 'us_average'; // Where data came from
  imageryDate?: { year: number; month: number; day: number }; // Google Solar imagery date
  imageryQuality?: 'HIGH' | 'MEDIUM' | 'LOW'; // Google Solar imagery quality
  stateName?: string; // State name for fallback data attribution
}

export interface ProductionData {
  annualKwh?: number;
  monthlyKwh?: number[];
  billOffset?: number; // %
  annualSavings?: number; // USD
  capacityFactor?: number;
  source?: 'nrel' | 'fallback';
}

export interface UsageData {
  monthlyBill?: number;
  monthlyKwh?: number;
  annualKwh?: number;
  averageRate?: number; // $/kWh
}

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  country?: string; // 'US' or 'Nigeria'
}

export interface RoofData {
  tilt?: number;
  azimuth?: number;
  shadingFactor?: number;
  roofArea?: number;
}

export interface PreferencesData {
  batteryIncluded?: boolean;
  financingType?: 'cash' | 'loan' | 'lease' | 'ppa';
  installationTimeline?: string;
  notes?: string;
}

export interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
}

interface CalculatorStore {
  // Form Data
  address: AddressData;
  usage: UsageData;
  roof: RoofData;
  preferences: PreferencesData;
  contact: ContactData;
  
  // Solar API Data
  solarData: SolarData;
  productionData: ProductionData;
  
  // UI State
  currentStep: number;
  isLoading: boolean;
  showSolarScore: boolean;
  
  // Actions
  setAddress: (address: AddressData) => void;
  setUsage: (usage: UsageData) => void;
  setRoof: (roof: RoofData) => void;
  setPreferences: (preferences: PreferencesData) => void;
  setContact: (contact: ContactData) => void;
  setSolarData: (data: SolarData) => void;
  setProductionData: (data: ProductionData) => void;
  setCurrentStep: (step: number) => void;
  setIsLoading: (loading: boolean) => void;
  setShowSolarScore: (show: boolean) => void;
  
  // Computed helpers
  canShowSolarScore: () => boolean;
  shouldSuggestBattery: () => boolean;
  getMotivationalMessage: () => string;
}

export const useCalculatorStore = create<CalculatorStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      address: { street: '', city: '', state: '', zip: '' },
      usage: {},
      roof: {},
      preferences: {},
      contact: {},
      solarData: {},
      productionData: {},
      currentStep: 0,
      isLoading: false,
      showSolarScore: false,

      // Actions
      setAddress: (address) => set({ address }),
      setUsage: (usage) => set({ usage }),
      setRoof: (roof) => set({ roof }),
      setPreferences: (preferences) => set({ preferences }),
      setContact: (contact) => set({ contact }),
      setSolarData: (data) => set({ solarData: data }),
      setProductionData: (data) => set({ productionData: data }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setShowSolarScore: (show) => set({ showSolarScore: show }),

      // Computed Helpers
      canShowSolarScore: () => {
        const { address, solarData } = get();
        return !!(address.latitude && address.longitude && solarData.solarScore);
      },

      shouldSuggestBattery: () => {
        const { usage, solarData } = get();
        // Suggest battery if monthly bill > $200 or annual kWh > 12000
        const highUsage = (usage.monthlyBill && usage.monthlyBill > 200) || 
                         (usage.annualKwh && usage.annualKwh > 12000);
        const goodSolar = solarData.solarScore && solarData.solarScore > 70;
        return !!(highUsage && goodSolar);
      },

      getMotivationalMessage: () => {
        const { currentStep, solarData, usage } = get();
        
        switch (currentStep) {
          case 0:
            return "Start by locking in your roof location.";
          case 1:
            if (solarData.solarScore && solarData.solarScore > 75) {
              return "Great location! Your setup looks very promising.";
            }
            return "Almost there! Let's calculate your savings.";
          case 2:
            if (usage.annualKwh && usage.annualKwh > 10000) {
              return "High usage = bigger savings potential!";
            }
            return "Understanding your energy needs...";
          case 3:
            if (solarData.sunExposurePercentage && solarData.sunExposurePercentage > 80) {
              return "Excellent roof conditions detected!";
            }
            return "Optimizing your solar system design...";
          case 4:
            return "Customize your solar experience!";
          case 5:
            return "Final step! Get your personalized solar plan.";
          default:
            return "Step " + (currentStep + 1) + "/6: Building your solar solution";
        }
      },
    })
  )
);
