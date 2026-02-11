"use client";

import { useState, useEffect, useCallback, useMemo, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { roofSchema, type Roof, type Address } from "../../../../types/leads";
import { useCalculatorStore, type RoofSegment } from "../../../store/calculatorStore";
import { AlertTriangle, Loader2, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SolarScoreTeaser } from "../SolarScoreTeaser";

// Leaflet needs window, so ensure CSR only
const RoofMap = dynamic(() => import("../RoofMap").then((mod) => ({ default: mod.RoofMap })), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] w-full items-center justify-center rounded-3xl border-2 border-emerald-100 bg-emerald-50">
      <div className="space-y-2 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
        <p className="text-sm font-medium text-emerald-700">Loading satellite map…</p>
      </div>
    </div>
  ),
});

const defaultRoof: Roof = {
  roofType: "asphalt",
  squareFeet: 2400,
  sunExposure: "good",
};

const roofTypeOptions: Array<{ value: Roof["roofType"]; label: string; description: string }> = [
  { value: "asphalt", label: "Architectural shingle", description: "Most pitched roofs in the U.S." },
  { value: "metal", label: "Standing seam metal", description: "Great for quick clamps" },
  { value: "tile", label: "Tile / slate", description: "Specialized mounts required" },
  { value: "flat", label: "Flat / membrane", description: "Ideal for ballast systems" },
  { value: "other", label: "Something unique", description: "We'll confirm during site survey" },
];

const exposurePercentLookup: Record<Roof["sunExposure"], number> = {
  excellent: 90,
  good: 78,
  fair: 62,
  poor: 45,
};

interface RoofStepProps {
  value?: Roof;
  onChange: (value: Roof) => void;
  address?: Address | null;
  onEditAddress?: () => void;
  onAddressCoordinatesChange?: (coords: { latitude: number; longitude: number }) => void;
}

type RoofTilePolygon = { points: string; filled: boolean };

export function RoofStep({ value, onChange, address, onEditAddress, onAddressCoordinatesChange }: RoofStepProps) {
  const {
    solarData,
    setSolarData,
    address: storeAddress,
    setAddress: setStoreAddress,
  } = useCalculatorStore();

  const resolvedAddress = useMemo<Address | null>(() => {
    if (address) {
      return {
        ...address,
        latitude: storeAddress.latitude ?? address.latitude,
        longitude: storeAddress.longitude ?? address.longitude,
      };
    }
    if (storeAddress?.street) {
      return {
        street: storeAddress.street,
        city: storeAddress.city,
        state: storeAddress.state,
        zip: storeAddress.zip,
        latitude: storeAddress.latitude,
        longitude: storeAddress.longitude,
      } as Address;
    }
    return null;
  }, [address, storeAddress]);
  const activeStateCode = resolvedAddress?.state || storeAddress.state || undefined;

  const [formValue, setFormValue] = useState<Roof>(value ?? defaultRoof);
  const [errors, setErrors] = useState<Partial<Record<keyof Roof, string>>>({});
  const [showShadingWarning, setShowShadingWarning] = useState(false);
  const [isRelocating, setIsRelocating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [initializedFromSolar, setInitializedFromSolar] = useState(false);
  const [tilt, setTilt] = useState<number>(solarData.optimalTilt ?? 24);
  const [azimuth, setAzimuth] = useState<number>(solarData.optimalAzimuth ?? 180);

  useEffect(() => {
    if (!value) {
      onChange(formValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value) {
      setFormValue(value);
    }
  }, [value]);

  const validate = useCallback(
    (updated: Roof) => {
      const result = roofSchema.safeParse(updated);
      if (result.success) {
        setErrors({});
        onChange(updated);
      } else {
        const fieldErrors: Partial<Record<keyof Roof, string>> = {};
        result.error.errors.forEach((err) => {
          const path = err.path[0] as keyof Roof;
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
    },
    [onChange]
  );

  const handleChange = (field: keyof Roof, val: Roof[keyof Roof]) => {
    const updated = { ...formValue, [field]: val } as Roof;
    setFormValue(updated);
    validate(updated);
  };

  const mapLatitude = resolvedAddress?.latitude ?? solarData.roofCenter?.latitude;
  const mapLongitude = resolvedAddress?.longitude ?? solarData.roofCenter?.longitude;
  const hasMapCoordinates = typeof mapLatitude === "number" && typeof mapLongitude === "number";


  useEffect(() => {
    if (!solarData || isDragging) return;

    const derivedSquareFeet = Math.max(
      1200,
      Math.round(solarData.roofAreaSqft ?? formValue.squareFeet ?? defaultRoof.squareFeet)
    );
    const derivedExposure = determineSunExposure(solarData.sunExposurePercentage);

    const shouldUpdate =
      !initializedFromSolar ||
      formValue.squareFeet !== derivedSquareFeet ||
      (!value && formValue.sunExposure !== derivedExposure);

    if (shouldUpdate) {
      const updated: Roof = {
        roofType: formValue.roofType || defaultRoof.roofType,
        squareFeet: derivedSquareFeet,
        sunExposure: derivedExposure,
      };
      setFormValue(updated);
      validate(updated);
      setInitializedFromSolar(true);
    }

    if (typeof solarData.optimalTilt === "number") {
      setTilt(solarData.optimalTilt);
    }
    if (typeof solarData.optimalAzimuth === "number") {
      setAzimuth(solarData.optimalAzimuth);
    }

    setShowShadingWarning((solarData.shadingPercentage ?? 0) > 30);
  }, [solarData, formValue.roofType, formValue.squareFeet, formValue.sunExposure, initializedFromSolar, validate, value, isDragging]);

  const handleMarkerDrag = useCallback(
    async (lat: number, lng: number) => {
      if (isRelocating || isDragging || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

      setIsDragging(true);
      setIsRelocating(true);

      try {
        const response = await fetch("/api/google-solar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            stateCode: activeStateCode,
          }),
        });

        if (!response.ok) {
          throw new Error(`API ${response.status}`);
        }

        const data = await response.json();
        const roofCenter = data.center || { latitude: lat, longitude: lng };
        const totalArea = data.roofSegments?.reduce((sum: number, seg: RoofSegment) => sum + (seg.area || 0), 0) || 0;
        const segmentCount = data.roofSegments?.length || 0;
        const avgSunExposure =
          segmentCount > 0
            ? data.roofSegments.reduce((sum: number, seg: RoofSegment) => sum + (seg.sunExposure || 0), 0) / segmentCount
            : 75;

        const rawSource = typeof data._source === "string" ? data._source : undefined;
        const normalizedSource: "google_solar_api" | "state_average" | "us_average" =
          rawSource === "state_average" || rawSource === "us_average" ? rawSource : "google_solar_api";

        const nextSolarData = {
          roofAreaSqft: Math.round(totalArea * 10.764),
          sunExposurePercentage: Math.round(avgSunExposure),
          shadingPercentage: Math.round(100 - avgSunExposure),
          optimalTilt: data.roofSegments?.[0]?.tilt || 20,
          optimalAzimuth: data.roofSegments?.[0]?.azimuth || 180,
          maxPanels: data.maxArrayPanels || 30,
          roofSegments: data.roofSegments || [],
          roofCenter,
          roofOutline: data.roofOutline,
          roofOutlineSource: data.roofOutlineSource,
          dataSource: normalizedSource,
          imageryDate: data.imageryDate,
          imageryQuality: data.imageryQuality,
          stateName: data._stateName,
          solarScore: Math.min(100, Math.round((avgSunExposure + totalArea * 0.1) / 2)),
          peakSunHours: data.peakSunHours || 4.5,
          percentileRanking: avgSunExposure > 85 ? 10 : avgSunExposure > 70 ? 25 : 50,
        };

        setSolarData(nextSolarData);
        setStoreAddress({ ...storeAddress, latitude: lat, longitude: lng });
        onAddressCoordinatesChange?.({ latitude: lat, longitude: lng });

        const updatedRoof: Roof = {
          roofType: formValue.roofType || defaultRoof.roofType,
          squareFeet: Math.max(1200, nextSolarData.roofAreaSqft || formValue.squareFeet || defaultRoof.squareFeet),
          sunExposure: determineSunExposure(nextSolarData.sunExposurePercentage),
        };

        setFormValue(updatedRoof);
        validate(updatedRoof);
        setTilt(nextSolarData.optimalTilt ?? tilt);
        setAzimuth(nextSolarData.optimalAzimuth ?? azimuth);
        setShowShadingWarning((nextSolarData.shadingPercentage ?? 0) > 30);
      } catch (error) {
        console.error("[RoofStep] Marker drag re-fetch failed", error);
      } finally {
        setIsRelocating(false);
        setIsDragging(false);
      }
    },
    [activeStateCode, azimuth, formValue.roofType, formValue.squareFeet, isDragging, isRelocating, onAddressCoordinatesChange, setSolarData, setStoreAddress, storeAddress, tilt, validate]
  );

  const areaDisplay = useMemo(() => Math.round(formValue.squareFeet || defaultRoof.squareFeet), [formValue.squareFeet]);
  const normalizedTilt = useMemo(() => Math.min(60, Math.max(0, tilt ?? 24)), [tilt]);
  const directionLabel = useMemo(() => getDirectionLabel(azimuth), [azimuth]);
  const directionRotation = useMemo(() => azimuth, [azimuth]);
  const roofTilePolygons = useMemo<RoofTilePolygon[]>(() => {
    const rows = 3;
    const cols = 4;
    const totalTiles = rows * cols;
    const fillRatio = Math.min(1, (formValue.squareFeet || defaultRoof.squareFeet) / 4000);
    const filledTiles = Math.max(1, Math.round(fillRatio * totalTiles));

    return Array.from({ length: totalTiles }, (_, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = 30 + col * 36 + row * 5;
      const y = 90 - row * 12;
      const points = `${x},${y} ${x + 26},${y - 8} ${x + 48},${y + 4} ${x + 22},${y + 12}`;
      return { points, filled: idx < filledTiles };
    });
  }, [formValue.squareFeet]);

  const sunExposurePercent = solarData.sunExposurePercentage ?? exposurePercentLookup[formValue.sunExposure];
  const shadingPercent = solarData.shadingPercentage ?? Math.max(0, 100 - sunExposurePercent);
  const mapHeaderMessage = hasMapCoordinates ? (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 text-xs font-semibold text-emerald-900">
      <span>Marker slightly off? Tap change or drag the pin below to re-center.</span>
      {onEditAddress && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEditAddress}
          className="ml-auto h-7 rounded-full border-emerald-200 px-3 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Change address?
        </Button>
      )}
    </div>
  ) : undefined;
  const peakSunHours = solarData.peakSunHours ?? 4.6;
  const sunWindowDetails = getSunWindowDetails(peakSunHours, solarData.sunExposurePercentage);
  const directionAbbreviation = getDirectionAbbreviation(azimuth);

  return (
    <div className="space-y-6">
      {hasMapCoordinates && (
        <div className="relative rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-50/60">
          {isRelocating && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-3 shadow-lg">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                <span className="text-sm font-medium text-gray-800">Analyzing new roof…</span>
              </div>
            </div>
          )}
          <RoofMap
            latitude={mapLatitude as number}
            longitude={mapLongitude as number}
            roofSegments={solarData.roofSegments || []}
            onPositionChange={handleMarkerDrag}
            zoom={19}
            headerMessage={mapHeaderMessage}
          />
        </div>
      )}

      {solarData?.solarScore && (
        <div className="rounded-3xl bg-white/95 p-1.5">
          <SolarScoreTeaser
            solarScore={solarData.solarScore}
            peakSunHours={solarData.peakSunHours}
            percentileRanking={solarData.percentileRanking}
            estimatedSavingsRange={solarData.estimatedSavingsRange || { min: 900, max: 1600 }}
            showSavings={false}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-amber-50 p-5 text-sm">
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <Sun className="h-5 w-5" />
            <p className="font-semibold uppercase tracking-[0.35em] text-[11px]">Sun exposure summary</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-yellow-900/70">Direct sunlight</p>
              <p className="text-2xl font-black text-yellow-900">{sunExposurePercent}%</p>
            </div>
            <div>
              <p className="text-yellow-900/70">Shading</p>
              <p className="text-2xl font-black text-yellow-900">{shadingPercent}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-5 text-sm shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-600">Peak sunlight window</p>
          <p className="mt-3 text-4xl font-black text-emerald-700">
            {peakSunHours.toFixed(1)} <span className="text-base font-semibold">hrs</span>
          </p>
          <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.3em] text-emerald-500">{sunWindowDetails.windowLabel}</p>
          <p className="mt-2 text-xs text-emerald-700">{sunWindowDetails.tip}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500">
            <p>Your roof area</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-600 shadow">roof massing</span>
          </div>
          <p className="mt-3 text-4xl font-black text-emerald-700">
            {areaDisplay.toLocaleString()} <span className="text-base font-semibold text-emerald-500">sq ft</span>
          </p>
          <div className="relative mt-4 h-28 w-full">
            <svg viewBox="0 0 220 120" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <polygon points="20,90 110,25 200,55 110,115" fill="url(#roofGradient)" stroke="#10b981" strokeWidth="1" opacity="0.35" />
              {roofTilePolygons.map((tile, idx) => (
                <polygon
                  key={`tile-${idx}`}
                  points={tile.points}
                  fill={tile.filled ? "#10b981" : "#d1fae5"}
                  opacity={tile.filled ? 0.92 : 0.45}
                />
              ))}
            </svg>
          </div>
          {solarData.roofAreaSqft && (
            <p className="mt-2 text-[11px] text-emerald-700">Satellite pick-up: {Math.round(solarData.roofAreaSqft).toLocaleString()} sq ft</p>
          )}
          {errors.squareFeet && <p className="mt-2 text-xs text-red-600">{errors.squareFeet}</p>}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500">
            <p>Tilt profile</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">angle</span>
          </div>
          <p className="mt-3 text-4xl font-black text-slate-800">{normalizedTilt.toFixed(1)}°</p>
          <div className="relative mx-auto mt-4 h-32 w-32">
            <svg viewBox="0 0 200 120" className="absolute inset-0">
              <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
              <path
                d="M20 110 A80 80 0 0 1 180 110"
                fill="none"
                stroke="#10b981"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${normalizedTilt * 4} 999`}
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
              <text x="20" y="120" fontSize="10" fill="#94a3b8">Flat</text>
              <text x="150" y="120" fontSize="10" fill="#94a3b8">Steep</text>
            </svg>
            <div className="absolute inset-0 flex items-end justify-center">
              <div
                className="relative h-24 w-1 origin-bottom"
                style={{ transform: `rotate(${-normalizedTilt}deg)`, transition: "transform 0.6s ease" }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-20 w-1 rounded-full bg-gradient-to-b from-emerald-300 to-emerald-600 shadow-lg" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-emerald-500" />
              </div>
            </div>
          </div>
          {solarData.optimalTilt && (
            <p className="mt-2 text-[11px] text-emerald-700">Optimal tilt nearby: {Math.round(solarData.optimalTilt)}°</p>
          )}
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500">
            <p>Facing</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">compass</span>
          </div>
          <div className="mt-3 text-4xl font-black text-slate-900">
            <span>{directionAbbreviation}</span>
            <span className="ml-2 align-baseline text-base font-semibold uppercase tracking-[0.3em] text-emerald-600">
              {directionLabel}
            </span>
          </div>
          <div className="relative mx-auto mt-4 h-32 w-32">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-50 bg-gradient-to-br from-white to-emerald-50" />
            <div className="absolute inset-3 rounded-full border border-emerald-100" />
            {["N", "E", "S", "W"].map((label, idx) => {
              const positions: CSSProperties[] = [
                { top: "-6px", left: "50%", transform: "translateX(-50%)" },
                { right: "-6px", top: "50%", transform: "translateY(-50%)" },
                { bottom: "-6px", left: "50%", transform: "translateX(-50%)" },
                { left: "-6px", top: "50%", transform: "translateY(-50%)" },
              ];
              return (
                <span key={label} className="absolute text-[11px] font-semibold text-emerald-700" style={positions[idx]}>
                  {label}
                </span>
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="relative h-1 w-1"
                style={{ transform: `rotate(${directionRotation}deg)`, transition: "transform 0.6s ease" }}
              >
                {/* Needle pointing outward from center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-14 w-1 rounded-full bg-gradient-to-t from-emerald-300 via-emerald-500 to-emerald-700 shadow" style={{ transformOrigin: 'bottom center' }} />
                <div className="absolute -top-[3.6rem] left-1/2 -translate-x-1/2 w-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-emerald-600 drop-shadow" />
                {/* Small center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-emerald-600 shadow" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-emerald-700">Azimuth {azimuth.toFixed(1)}°</p>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
          <p>What's your roof surface?</p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-wide text-emerald-700">Helps installers plan mounts</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">Pre-filled from aerial cues — update it if your surface differs.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {roofTypeOptions.map((option) => {
            const isActive = formValue.roofType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange("roofType", option.value)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200"
                }`}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            );
          })}
        </div>
        {errors.roofType && <p className="mt-2 text-xs text-red-600">{errors.roofType}</p>}
      </div>

      {showShadingWarning && (
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Trees may reduce output</p>
              <p className="text-xs text-amber-700">
                We detected {solarData.shadingPercentage}% shading. Expect up to ~{Math.round((solarData.shadingPercentage || 0) * 0.7)}% production loss unless trees are trimmed.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function determineSunExposure(percentage?: number): Roof["sunExposure"] {
  if (!percentage) return "good";
  if (percentage >= 85) return "excellent";
  if (percentage >= 70) return "good";
  if (percentage >= 55) return "fair";
  return "poor";
}

function getDirectionLabel(azimuth: number): string {
  if (azimuth >= 337.5 || azimuth < 22.5) return "North";
  if (azimuth >= 22.5 && azimuth < 67.5) return "Northeast";
  if (azimuth >= 67.5 && azimuth < 112.5) return "East";
  if (azimuth >= 112.5 && azimuth < 157.5) return "Southeast";
  if (azimuth >= 157.5 && azimuth < 202.5) return "South";
  if (azimuth >= 202.5 && azimuth < 247.5) return "Southwest";
  if (azimuth >= 247.5 && azimuth < 292.5) return "West";
  return "Northwest";
}

function getDirectionAbbreviation(azimuth: number): string {
  if (azimuth >= 337.5 || azimuth < 22.5) return "N";
  if (azimuth >= 22.5 && azimuth < 67.5) return "NE";
  if (azimuth >= 67.5 && azimuth < 112.5) return "E";
  if (azimuth >= 112.5 && azimuth < 157.5) return "SE";
  if (azimuth >= 157.5 && azimuth < 202.5) return "S";
  if (azimuth >= 202.5 && azimuth < 247.5) return "SW";
  if (azimuth >= 247.5 && azimuth < 292.5) return "W";
  return "NW";
}

function getSunWindowDetails(hours: number, exposurePercentage?: number) {
  if (hours >= 5.5) {
    return {
      windowLabel: "10:30a – 3:30p",
      tip: "This pitch tracks the sun almost perfectly at midday. Expect the strongest harvest through early afternoon.",
    };
  }
  if (hours >= 4.5) {
    return {
      windowLabel: "9:45a – 2:15p",
      tip:
        exposurePercentage && exposurePercentage < 70
          ? "Trees clip the late afternoon a bit, but late-morning to early afternoon remains productive."
          : "Panels hit their stride late morning and carry well into early afternoon before shade creeps in.",
    };
  }
  if (hours >= 3.5) {
    return {
      windowLabel: "10:00a – 1:30p",
      tip: "Moderate sun window — consider panel placement to maximize the strongest midday hours.",
    };
  }
  return {
    windowLabel: "10:30a – 12:30p",
    tip: "Shorter productive window due to shading. Tree trimming or alternate panel placement could help.",
  };
}

