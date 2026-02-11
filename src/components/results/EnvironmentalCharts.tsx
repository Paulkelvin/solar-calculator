"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Leaf, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BillOffsetChartProps {
  offsetPercentage: number;
  annualConsumption: number; // kWh
  annualProduction: number; // kWh
}

export function BillOffsetChart({ 
  offsetPercentage, 
  annualConsumption,
  annualProduction 
}: BillOffsetChartProps) {
  const solarCovered = Math.min(annualProduction, annualConsumption);
  const gridCovered = Math.max(0, annualConsumption - annualProduction);
  
  const data = [
    { name: "Solar Power", value: solarCovered, color: "#22c55e" },
    { name: "Grid Power", value: gridCovered, color: "#94a3b8" },
  ];

  return (
    <Card className="border-2 border-green-300 overflow-visible">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Bill Offset Breakdown</CardTitle>
          </div>
          <Badge className="bg-green-600 text-white">
            {Math.round(offsetPercentage)}% Solar
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent, cx, x, y }: { name?: string; percent?: number; cx?: number; x?: number; y?: number }) => {
                const label = `${name || ''}: ${Math.round((percent || 0) * 100)}%`;
                // Position text anchor based on which side of the pie it's on
                const anchor = (x || 0) > (cx || 0) ? "start" : "end";
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#374151"
                    fontSize={12}
                    textAnchor={anchor}
                    dominantBaseline="central"
                  >
                    {label}
                  </text>
                );
              }}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString()} kWh`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Solar Production</p>
            <p className="font-bold text-green-700 dark:text-green-400">
              {annualProduction.toLocaleString()} kWh/yr
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Your Usage</p>
            <p className="font-bold text-gray-700 dark:text-gray-300">
              {annualConsumption.toLocaleString()} kWh/yr
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EnvironmentalImpactChartProps {
  annualProduction: number; // kWh
  co2OffsetTons: number;
  treesEquivalent: number;
}

export function EnvironmentalImpactChart({
  annualProduction,
  co2OffsetTons,
  treesEquivalent,
}: EnvironmentalImpactChartProps) {
  // Breakdown: Solar offset vs remaining grid emissions
  // co2OffsetTons = what solar saves; remaining = typical household total minus saved
  const typicalHouseholdCO2 = annualProduction > 0
    ? co2OffsetTons / Math.min(1, annualProduction / 10800) // scale to full consumption
    : co2OffsetTons * 2;
  const remainingGridCO2 = Math.max(0, typicalHouseholdCO2 - co2OffsetTons);

  const data = [
    { name: "CO\u2082 Saved (Solar)", value: co2OffsetTons, color: "#22c55e" },
    { name: "Remaining Grid CO\u2082", value: remainingGridCO2, color: "#ef4444" },
  ];

  return (
    <Card className="border-2 border-emerald-300 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Environmental Impact</CardTitle>
          </div>
          <Badge className="bg-emerald-600 text-white">
            🌱 Clean Energy
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => {
                const short = name.includes("Saved") ? "Saved" : "Grid";
                return `${short}: ${Math.round(percent * 100)}%`;
              }}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)} tons CO₂`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                🌍 CO₂ Offset
              </p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {co2OffsetTons.toFixed(1)} tons/yr
              </p>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Equivalent to planting <strong>{treesEquivalent}</strong> trees per year
            </p>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                ♻️ Clean Energy
              </p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {annualProduction.toLocaleString()} kWh/yr
              </p>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Powers equivalent to driving {Math.round(co2OffsetTons * 2500)} fewer miles per year
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
