"use client";

import { useEffect, useState } from "react";
import { Zap, TrendingUp, DollarSign, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCalculatorStore } from "../../store/calculatorStore";
import { fetchProductionEstimate, formatMonthlyData, calculateBillOffset, type PVWattsResult } from "../../lib/pvwatts-service";
import { AVG_PRODUCTION_PER_KW, getSunFactor } from "@/lib/calculations/solar";

interface LiveProductionPreviewProps {
  onStatusChange?: (status: 'idle' | 'loading' | 'ready') => void;
}

export function LiveProductionPreview({ onStatusChange }: LiveProductionPreviewProps = {}) {
  const { address, usage, roof, solarData, setProductionData } = useCalculatorStore();
  const [estimate, setEstimate] = useState<PVWattsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthly, setShowMonthly] = useState(true);

  useEffect(() => {
    // Debounce: Only fetch if we have all required data
    if (!address.latitude || !address.longitude || !usage.annualKwh) {
      onStatusChange?.('idle');
      return;
    }

    // === SYSTEM SIZING ===
    // When Google Solar is available, use its production-per-kW for sizing
    // (matches performSolarCalculation and UsageStep sizing)
    const hasGoogleSolar = solarData.panelCapacityWatts && solarData.panelCapacityWatts > 0
      && solarData.annualProduction && solarData.annualProduction > 0
      && solarData.googleSolarSource === 'real';

    let recommendedSize: number;
    if (hasGoogleSolar) {
      const googleMaxKw = solarData.panelCapacityWatts! / 1000;
      const googleProdPerKw = solarData.annualProduction! / googleMaxKw;
      recommendedSize = Math.round(Math.min(
        usage.annualKwh * 0.8 / googleProdPerKw,
        googleMaxKw
      ) * 10) / 10;
    } else {
      // Fallback to mock formula when Google Solar unavailable
      const sunFactor = getSunFactor({ sunExposurePercentage: solarData.sunExposurePercentage });
      recommendedSize = Math.round((usage.annualKwh * 0.8 / (AVG_PRODUCTION_PER_KW * sunFactor)) * 10) / 10;
    }

    // Apply roof constraint: ~54 sq ft per kW, ~60% usable area
    if (solarData.roofAreaSqft && solarData.roofAreaSqft > 0) {
      const roofConstraint = Math.round(((solarData.roofAreaSqft * 0.6) / 54) * 10) / 10;
      recommendedSize = Math.min(recommendedSize, roofConstraint);
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      onStatusChange?.('loading');
      const result = await fetchProductionEstimate(
        address.latitude!,
        address.longitude!,
        recommendedSize,
        {
          tilt: roof.roofArea ? (solarData.optimalTilt || 20) : undefined,
          azimuth: roof.roofArea ? (solarData.optimalAzimuth || 180) : undefined,
          stateCode: address.state,
        }
      );
      setEstimate(result);
      // Persist NREL data to store so other components (UsageStep, FinancialPreview) can use it
      if (result) {
        setProductionData({
          annualKwh: result.production.annual,
          monthlyKwh: result.production.monthly,
          billOffset: calculateBillOffset(result.production.annual, usage.annualKwh || 0),
          annualSavings: result.savings.annual,
          capacityFactor: result.production.capacityFactor,
          source: result.source,
        });
      }
      setIsLoading(false);
      onStatusChange?.(result ? 'ready' : 'idle');
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.latitude, address.longitude, usage.annualKwh, roof.roofArea,
      solarData.panelCapacityWatts, solarData.annualProduction, solarData.googleSolarSource,
      solarData.roofAreaSqft, solarData.sunExposurePercentage, solarData.optimalTilt, solarData.optimalAzimuth]);

  if (!address.latitude || !usage.annualKwh) {
    return null; // Don't show until we have basic data
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <Zap className="absolute inset-0 m-auto h-4 w-4 text-blue-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Fetching solar production data from NREL…
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Analyzing local weather patterns, sun hours, and panel output for your location
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!estimate) {
    return (
      <Card className="border border-gray-200 bg-gray-50 dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Solar production data is not available for this location. Financial estimates use national averages.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const billOffset = calculateBillOffset(estimate.production.annual, usage.annualKwh || 0);
  const monthlyData = formatMonthlyData(estimate.production.monthly);

  // Determine if Google Solar is the primary data source —
  // if so, suppress conflicting NREL headline numbers (they use a different production model)
  const hasGoogleSolar = !!(solarData.panelCapacityWatts && solarData.panelCapacityWatts > 0
    && solarData.annualProduction && solarData.annualProduction > 0
    && solarData.googleSolarSource === 'real');

  return (
    <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-50 dark:from-amber-950 dark:to-amber-950 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">
              {hasGoogleSolar ? 'Seasonal Production Pattern' : 'What Solar Will Produce For You'}
            </CardTitle>
          </div>
          {estimate.source === 'fallback' && (
            <Badge className="border border-amber-200 bg-amber-50 text-amber-800 text-xs shadow-sm">
              <Info className="h-3 w-3 mr-1" />
              US Average
            </Badge>
          )}
          {estimate.source === 'nrel' && (
            <Badge className="border border-amber-700/40 bg-amber-600 text-white text-xs shadow-sm uppercase tracking-wide">
              NREL Data
            </Badge>
          )}
        </div>
        {estimate.location.city && (
          <p className="text-xs text-muted-foreground">
            Based on {estimate.location.city}, {estimate.location.state} weather data
          </p>
        )}
        {hasGoogleSolar && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Monthly pattern from NREL weather data. Financial estimates use Google Solar satellite analysis.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics — only shown when Google Solar is NOT available (avoids conflicting numbers) */}
        {!hasGoogleSolar && (
        <div className="grid grid-cols-3 gap-3">
          {/* Annual Production */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-muted-foreground">Solar Will Produce</p>
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {estimate.production.annual.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">kWh/year</p>
          </div>

          {/* Bill Offset */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">Bill Coverage</p>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {billOffset}%
            </p>
            <p className="text-xs text-muted-foreground">of your usage</p>
          </div>

          {/* Annual Savings */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-muted-foreground">You'll Save</p>
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              ${estimate.savings.annual.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">per year</p>
          </div>
        </div>
        )}

        {/* Monthly Chart Toggle — when Google Solar active, chart is the main content */}
        {!hasGoogleSolar && (
        <button
          onClick={() => setShowMonthly(!showMonthly)}
          className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showMonthly ? '▲ Hide' : '▼ Show'} Monthly Breakdown
        </button>
        )}

        {/* Monthly Production Chart */}
        {(showMonthly || hasGoogleSolar) && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium mb-3">Monthly Solar Production (kWh)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11 }}
                  stroke="#888"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  stroke="#888"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} kWh`, 'Production']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#d97706" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              💡 Peak production in summer months (Jun-Aug)
            </p>
          </div>
        )}

        {/* System Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>System:</strong> {estimate.system.capacity} kW • 
            Tilt: {solarData.optimalTilt ? Math.round(solarData.optimalTilt) : estimate.system.tilt}° • 
            Azimuth: {solarData.optimalAzimuth ? Math.round(solarData.optimalAzimuth) : estimate.system.azimuth}°
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Capacity Factor: {estimate.production.capacityFactor}% • 
            Rate: ${estimate.savings.rate}/kWh
          </p>
        </div>

        {estimate.note && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ℹ️ {estimate.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
