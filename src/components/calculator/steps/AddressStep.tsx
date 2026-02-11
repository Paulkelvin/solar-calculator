"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { type Address } from "../../../../types/leads";
import {
  fetchPlacePredictions,
  fetchPlaceDetails,
  type PlacePrediction
} from "../../../lib/google-places";
import { useCalculatorStore, type AddressData } from "../../../store/calculatorStore";
import { calculateSolarScore } from "../../../lib/solar-score";
import { getPeakSunHours } from "../../../lib/state-sun-hours";
import { getStateIncentives } from "../../../lib/us-incentives-data";

interface AddressStepProps {
  value?: Address;
  onChange: (address: Address, meta?: { userInitiated?: boolean }) => void;
}

const toStoreAddress = (address: Address): AddressData => ({
  street: address.street,
  city: address.city,
  state: address.state,
  zip: address.zip,
  latitude: address.latitude,
  longitude: address.longitude,
});

const formatAddressLine = (address: Address) => {
  const parts = [
    address.street,
    [address.city, address.state].filter(Boolean).join(", ") || undefined,
    address.zip,
  ].filter(Boolean);
  return parts.join(", ");
};

const transformSolarApiResponse = (
  data: any,
  latitude: number,
  longitude: number,
  stateCode?: string
) => {
  const roofCenter = data?.center || { latitude, longitude };
  const segments = Array.isArray(data?.roofSegments) ? data.roofSegments : [];
  const totalArea = segments.reduce((sum: number, seg: any) => sum + (seg.area || 0), 0);
  const segmentCount = segments.length;
  const avgSunExposure = segmentCount > 0
    ? segments.reduce((sum: number, seg: any) => sum + (seg.sunExposure || 0), 0) / segmentCount
    : 75;
  const totalSolarPotential = segments.reduce(
    (sum: number, seg: any) => sum + (seg.solarPotential || 0),
    0
  );
  const panelConfigs = Array.isArray(data?.panelConfigs) ? data.panelConfigs : [];
  // Use the LAST (largest) config — panelConfigs are sorted ascending by panelsCount
  const primaryConfig = panelConfigs[panelConfigs.length - 1] || panelConfigs[0];
  const estimatedAnnualProduction = Math.max(
    4000,
    Math.round(primaryConfig?.yearlyEnergyKwh || totalSolarPotential || totalArea * 120)
  );
  // Google Solar canonical capacity — single source of truth for financial calcs
  const panelCapacityWatts = primaryConfig?.systemSizeKw
    ? Math.round(primaryConfig.systemSizeKw * 1000)
    : 0;
  const googleSolarSource: 'real' | 'mock' = data?._source === 'google_solar_api' && primaryConfig?.yearlyEnergyKwh
    ? 'real'
    : 'mock';
  const normalizedStateCode = stateCode?.toUpperCase();
  const stateIncentives = normalizedStateCode ? getStateIncentives(normalizedStateCode) : null;
  const utilityRate = stateIncentives?.averageUtilityRate ?? 0.14;
  const estimatedSavingsMin = Math.max(
    500,
    Math.round(estimatedAnnualProduction * utilityRate * 0.65)
  );
  const estimatedSavingsMax = Math.max(
    estimatedSavingsMin + 500,
    Math.round(estimatedAnnualProduction * utilityRate * 0.9)
  );
  const peakSunHours = getPeakSunHours(normalizedStateCode);

  const solarPayload = {
    roofAreaSqft: Math.max(0, Math.round(totalArea * 10.764)),
    sunExposurePercentage: Math.max(0, Math.min(100, Math.round(avgSunExposure))),
    shadingPercentage: Math.max(0, Math.min(100, Math.round(100 - avgSunExposure))),
    optimalTilt: Math.max(0, Math.min(60, data?.roofSegments?.[0]?.tilt || 20)),
    optimalAzimuth: Math.max(0, Math.min(360, data?.roofSegments?.[0]?.azimuth || 180)),
    maxPanels: Math.max(0, Math.round(data?.maxArrayPanels || 30)),
    panelCapacityWatts,       // Google Solar max capacity in watts
    googleSolarSource,        // Whether this is real satellite data or a mock
    roofSegments: segments,
    roofCenter,
    roofOutline: data?.roofOutline,
    roofOutlineSource: data?.roofOutlineSource,
    dataSource: data?._source || 'google_solar_api',
    imageryDate: data?.imageryDate,
    imageryQuality: data?.imageryQuality,
    stateName: data?._stateName,
    solarScore: Math.max(
      0,
      Math.min(100, Math.round((avgSunExposure + Math.min(totalArea * 0.1, 50)) / 2))
    ),
    peakSunHours,
    percentileRanking: (() => {
      const score = Math.max(0, Math.min(100, Math.round((avgSunExposure + Math.min(totalArea * 0.1, 50)) / 2)));
      return score >= 85 ? 10 : score >= 70 ? 25 : score >= 55 ? 50 : 75;
    })(),
    estimatedSavingsRange: {
      min: estimatedSavingsMin,
      max: estimatedSavingsMax
    },
    annualProduction: estimatedAnnualProduction
  };

  return { solarPayload, roofCenter };
};

export function AddressStep({ value, onChange }: AddressStepProps) {
  // Empty default address - user must enter their own
  const defaultAddress: Address = {
    street: "",
    city: "",
    state: "",
    zip: "",
    latitude: undefined as any,
    longitude: undefined as any
  };

  const initialAddress = (value && value.street) ? value : defaultAddress;
  const [formValue, setFormValue] = useState<Address>(initialAddress);
  const [inputValue, setInputValue] = useState<string>(value && value.street ? formatAddressLine(initialAddress) : "");
  
  // Trigger update on mount if using default
  useEffect(() => {
    if (!value || !value.street) {
      onChange(defaultAddress, { userInitiated: false });
      setInputValue(formatAddressLine(defaultAddress));
    }
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [isLoadingSolarScore, setIsLoadingSolarScore] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(!!(value?.latitude && value?.longitude)); 
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    "Pinpointing your rooftop in satellite imagery…",
    "Measuring usable roof area and tilt…",
    "Projecting annual sunshine and incentives…"
  ];

  // Zustand store
  const { solarData, setSolarData, setShowSolarScore, showSolarScore } = useCalculatorStore();
  const setStoreAddress = useCalculatorStore((state) => state.setAddress);

  // Auto-show solar score if data already exists when component mounts
  useEffect(() => {
    if (solarData?.solarScore && addressConfirmed && !showSolarScore) {
      setShowSolarScore(true);
    }
  }, [solarData?.solarScore, addressConfirmed, showSolarScore, setShowSolarScore]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (addressConfirmed && isLoadingSolarScore) {
      interval = setInterval(() => {
        setLoadingMessageIndex((idx) => (idx + 1) % loadingMessages.length);
      }, 1500);
    } else {
      setLoadingMessageIndex(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [addressConfirmed, isLoadingSolarScore, loadingMessages.length]);

  // Fetch predictions as user types
  const handleStreetInputChange = async (val: string) => {
    setInputValue(val);
    const updated = { ...formValue, street: val };
    setFormValue(updated);
    setApiError(null);
    setAddressConfirmed(false);
    setShowSolarScore(false);
    setErrors((prev) => ({
      ...prev,
      street: val.trim() ? "" : "Address required"
    }));

    // Fetch predictions
    if (val.length > 2) {
      setIsLoadingPredictions(true);
      try {
        const preds = await fetchPlacePredictions(val);
        setPredictions(preds);
        setShowPredictions(true);
        setApiError(null);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Failed to fetch address suggestions. Please enter address manually.");
        setPredictions([]);
        setShowPredictions(false);
      } finally {
        setIsLoadingPredictions(false);
      }
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  // Handle prediction selection
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setShowPredictions(false);
    setIsLoadingPredictions(true);

    const details = await fetchPlaceDetails(prediction.placeId);

    if (details) {
      if (!details.city && prediction.secondaryText) {
        const parts = prediction.secondaryText.split(",");
        if (parts.length) {
          details.city = parts[0].trim();
        }
        if (!details.state && parts.length > 1) {
          const segment = parts[1].trim();
          const stateCandidate = segment.split(" ")[0].trim();
          details.state = stateCandidate.slice(0, 2).toUpperCase();
        }
      }
      const updated = {
        street: details.street,
        city: details.city,
        state: details.state,
        zip: details.zip,
        latitude: details.latitude,
        longitude: details.longitude
      };
      setFormValue(updated);
      onChange(updated, { userInitiated: true });
      setStoreAddress(toStoreAddress(updated));
      setErrors({});
      setAddressConfirmed(true);
      const formattedInput = formatAddressLine(updated) || prediction.description;
      setInputValue(formattedInput);

      // Fetch real roof data from Google Solar API
      if (details.latitude && details.longitude) {
        setIsLoadingSolarScore(true);
        
        try {
          // Call Google Solar API with state-specific fallbacks
          const response = await fetch('/api/google-solar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: details.latitude,
              longitude: details.longitude,
              stateCode: details.state
            })
          });

          if (response.ok) {
            const data = await response.json();
            const { solarPayload, roofCenter } = transformSolarApiResponse(
              data,
              details.latitude,
              details.longitude,
              details.state
            );
            setSolarData(solarPayload);
            setStoreAddress({
              ...toStoreAddress(updated),
              latitude: roofCenter.latitude,
              longitude: roofCenter.longitude
            });
            setFormValue((prev) => ({
              ...prev,
              latitude: roofCenter.latitude,
              longitude: roofCenter.longitude
            }));
            setShowSolarScore(true);
          } else {
            console.error('Google Solar API error:', response.status);
            // Fall back to basic score calculation if API fails
            const scoreData = await calculateSolarScore(details.latitude, details.longitude, 'US');
            if (scoreData) {
              const fallbackCenter = {
                latitude: details.latitude,
                longitude: details.longitude
              };
              setSolarData({ 
                ...scoreData, 
                dataSource: 'us_average',
                roofSegments: [],
                roofCenter: fallbackCenter
              });
              setStoreAddress({
                ...toStoreAddress(updated),
                latitude: fallbackCenter.latitude,
                longitude: fallbackCenter.longitude
              });
              setShowSolarScore(true);
            }
          }
        } catch (error) {
          console.error('Error fetching solar data:', error);
          // Fall back to basic score calculation
          const scoreData = await calculateSolarScore(details.latitude, details.longitude, 'US');
          if (scoreData) {
            const fallbackCenter = {
              latitude: details.latitude,
              longitude: details.longitude
            };
            setSolarData({ 
              ...scoreData, 
              dataSource: 'us_average',
              roofSegments: [],
              roofCenter: fallbackCenter
            });
            setStoreAddress({
              ...toStoreAddress(updated),
              latitude: fallbackCenter.latitude,
              longitude: fallbackCenter.longitude
            });
            setShowSolarScore(true);
          }
        }
        
        setIsLoadingSolarScore(false);
      }
    }

    setIsLoadingPredictions(false);
  };

  // Close predictions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
          {apiError}
        </div>
      )}

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Enter your address</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleStreetInputChange(e.target.value)}
            onFocus={() => predictions.length > 0 && setShowPredictions(true)}
            className="w-full rounded border border-gray-300 pl-12 pr-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            placeholder="Start typing to find your address"
            autoComplete="off"
          />
        </div>
        {errors.street && (
          <p className="mt-1 text-xs text-red-600">{errors.street}</p>
        )}

        {showPredictions && predictions.length > 0 && (
          <div
            ref={predictionsRef}
            className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded border border-gray-300 bg-white shadow-lg"
          >
            {predictions.map((pred) => (
              <button
                key={pred.placeId}
                onClick={() => handleSelectPrediction(pred)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100 last:border-0"
              >
                <div className="font-medium text-gray-900">{pred.mainText}</div>
                {pred.secondaryText && (
                  <div className="text-xs text-gray-500">{pred.secondaryText}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {isLoadingPredictions && !isLoadingSolarScore && (
          <p className="mt-1 text-xs text-gray-500">Searching...</p>
        )}

        {addressConfirmed && isLoadingSolarScore && (
          <div className="mt-4 rounded-3xl border border-emerald-100 bg-gradient-to-b from-white via-white to-emerald-50/40 px-6 py-6 shadow-[0_25px_60px_rgba(16,185,129,0.18)] backdrop-blur">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                <div className="absolute inset-2 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">Analyzing solar potential…</p>
                <p className="text-xs text-gray-500 mt-1 transition-opacity duration-500">
                  {loadingMessages[loadingMessageIndex]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
