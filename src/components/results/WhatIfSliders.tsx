"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Settings, DollarSign, TrendingUp, Battery } from "lucide-react";

interface WhatIfSlidersProps {
  baseSystemCost: number;
  baseAnnualProduction: number;
  baseUtilityRate: number;
  onParametersChange?: (params: WhatIfParameters) => void;
}

export interface WhatIfParameters {
  utilityRateEscalation: number; // % annual increase
  batteryAdded: boolean;
  batterySize: number; // kWh
  batteryCost: number; // $
  systemDegradation: number; // % annual loss
}

export function WhatIfSliders({
  baseSystemCost,
  baseAnnualProduction,
  baseUtilityRate,
  onParametersChange
}: WhatIfSlidersProps) {
  const [rateEscalation, setRateEscalation] = useState(3.5);
  const [batteryAdded, setBatteryAdded] = useState(false);
  const [batterySize, setBatterySize] = useState(10); // kWh
  const [degradation, setDegradation] = useState(0.5); // %/year

  // Calculate battery cost based on size (~$800-1000/kWh)
  const batteryCost = batteryAdded ? batterySize * 900 : 0;
  const totalSystemCost = baseSystemCost + batteryCost;

  // Calculate estimated battery value add (15-20% additional savings)
  const batteryValuePercent = batteryAdded ? 0.175 : 0;
  const annualSavingsWithBattery = baseAnnualProduction * baseUtilityRate * (1 + batteryValuePercent);

  // Calculate 25-year totals with escalation
  let cumulativeSavings = 0;
  for (let year = 1; year <= 25; year++) {
    const yearMultiplier = Math.pow(1 + rateEscalation / 100, year);
    const yearDegradation = 1 - (year * (degradation / 100));
    const yearSavings = annualSavingsWithBattery * yearMultiplier * yearDegradation;
    cumulativeSavings += yearSavings;
  }

  const netSavings = cumulativeSavings - totalSystemCost;
  const roi = ((cumulativeSavings / totalSystemCost) - 1) * 100;
  const paybackYears = totalSystemCost / annualSavingsWithBattery;

  // Debounced parameter update to prevent chart resets (300ms)
  const updateParameters = useCallback(() => {
    if (onParametersChange) {
      onParametersChange({
        utilityRateEscalation: rateEscalation,
        batteryAdded,
        batterySize,
        batteryCost,
        systemDegradation: degradation,
      });
    }
  }, [rateEscalation, batteryAdded, batterySize, batteryCost, degradation, onParametersChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParameters();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [updateParameters]);

  return (
    <Card className="border-2 border-purple-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">What-If Analysis</CardTitle>
          </div>
          <Badge className="bg-purple-600 text-white text-xs">
            Interactive
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Adjust assumptions to see how they impact your solar investment
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Utility Rate Escalation Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Utility Rate Escalation
            </label>
            <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
              {rateEscalation.toFixed(1)}% / year
            </span>
          </div>
          <Slider
            value={[rateEscalation]}
            onValueChange={(val) => {
              setRateEscalation(val[0]);
            }}
            min={2.0}
            max={6.0}
            step={0.5}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>2% (Conservative)</span>
            <span>6% (Aggressive)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Historical US average: 3-4% annually. Higher rates increase solar value over time.
          </p>
        </div>

        {/* Battery Add-On Toggle */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Battery className="h-4 w-4 text-amber-600" />
              Add Battery Storage?
            </label>
            <button
              onClick={() => {
                setBatteryAdded(!batteryAdded);
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                batteryAdded
                  ? "bg-amber-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {batteryAdded ? "Yes" : "No"}
            </button>
          </div>

          {batteryAdded && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Battery Size</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  {batterySize} kWh
                </span>
              </div>
              <Slider
                value={[batterySize]}
                onValueChange={(val) => {
                  setBatterySize(val[0]);
                }}
                min={5}
                max={20}
                step={5}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5 kWh</span>
                <span>20 kWh</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-amber-700 dark:text-amber-300">
                  Estimated Cost: <strong>${batteryCost.toLocaleString()}</strong>
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  +17.5% Savings
                </span>
              </div>
            </div>
          )}
        </div>

        {/* System Degradation Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              Annual System Degradation
            </label>
            <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
              {degradation.toFixed(1)}% / year
            </span>
          </div>
          <Slider
            value={[degradation]}
            onValueChange={(val) => {
              setDegradation(val[0]);
            }}
            min={0.3}
            max={1.0}
            step={0.1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0.3% (Premium)</span>
            <span>1.0% (Standard)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Industry average: 0.5-0.7% annually. Premium panels degrade slower.
          </p>
        </div>

        {/* Updated Results */}
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            Updated 25-Year Projections
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <p className="text-xs text-muted-foreground">Total Savings</p>
              </div>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                ${Math.round(cumulativeSavings / 1000)}k
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-muted-foreground">Net Gain</p>
              </div>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                ${Math.round(netSavings / 1000)}k
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Payback Period</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {paybackYears.toFixed(1)} years
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">25-Year ROI</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {roi.toFixed(0)}%
              </p>
            </div>
          </div>

          {batteryAdded && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                🔋 Battery Impact
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Adding {batterySize} kWh battery storage increases savings by ~17.5% 
                by maximizing self-consumption and backup power value.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
