"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";

interface CashFlowData {
  year: number;
  cashSavings: number;
  loanSavings: number;
  leaseSavings: number;
  ppaSavings: number;
}

interface CashFlowChartProps {
  systemCost: number;
  annualSavings: number;
  loanMonthlyPayment?: number;
  loanDownPayment?: number;
  leaseMonthlyPayment?: number;
  ppaRate?: number; // $/kWh
  annualProduction?: number;
  utilityRate?: number; // $/kWh
  rateEscalation?: number; // % annual increase
}

export function CashFlowChart({
  systemCost,
  annualSavings,
  loanMonthlyPayment = 0,
  loanDownPayment = 0,
  leaseMonthlyPayment = 0,
  ppaRate = 0.10,
  annualProduction = 10000,
  utilityRate = 0.14,
  rateEscalation = 2.5,
}: CashFlowChartProps) {
  // Generate 25-year cash flow projections
  const data: CashFlowData[] = [];
  
  let cashCumulative = -systemCost; // Start with upfront cost
  let loanCumulative = -loanDownPayment; // Start with down payment cost
  let leaseCumulative = 0; // No upfront cost
  let ppaCumulative = 0; // No upfront cost
  
  const loanAnnualPayment = loanMonthlyPayment * 12;
  const leaseAnnualPayment = leaseMonthlyPayment * 12;
  
  for (let year = 0; year <= 25; year++) {
    // Calculate escalating utility rates and savings
    const yearMultiplier = Math.pow(1 + rateEscalation / 100, year);
    const escalatedUtilityRate = utilityRate * yearMultiplier;
    const escalatedAnnualSavings = annualProduction * escalatedUtilityRate;
    
    if (year === 0) {
      // Year 0: Initial costs
      data.push({
        year: 0,
        cashSavings: cashCumulative,
        loanSavings: loanCumulative,
        leaseSavings: leaseCumulative,
        ppaSavings: ppaCumulative,
      });
    } else {
      // Cash: Full savings minus degradation (~0.5%/year)
      const degradation = 1 - (year * 0.005);
      const cashAnnualSavings = escalatedAnnualSavings * degradation;
      cashCumulative += cashAnnualSavings;
      
      // Loan: Savings minus loan payment (25 years, matching LOAN_TERM_YEARS)
      const loanAnnualSavings = year <= 25 
        ? (escalatedAnnualSavings * degradation) - loanAnnualPayment
        : escalatedAnnualSavings * degradation;
      loanCumulative += loanAnnualSavings;
      
      // Lease: Savings minus lease payment (typically 20-25 years)
      const leaseAnnualSavings = year <= 20
        ? (escalatedAnnualSavings * degradation) - leaseAnnualPayment
        : escalatedAnnualSavings * degradation;
      leaseCumulative += leaseAnnualSavings;
      
      // PPA: Savings = (utility rate - PPA rate) * production
      const ppaAnnualSavings = (escalatedUtilityRate - ppaRate) * (annualProduction * degradation);
      ppaCumulative += ppaAnnualSavings;
      
      data.push({
        year,
        cashSavings: Math.round(cashCumulative),
        loanSavings: Math.round(loanCumulative),
        leaseSavings: Math.round(leaseCumulative),
        ppaSavings: Math.round(ppaCumulative),
      });
    }
  }
  
  // Calculate payback years for each option — interpolate for decimal precision
  const interpolatePayback = (key: 'cashSavings' | 'loanSavings') => {
    for (let i = 1; i < data.length; i++) {
      if (data[i][key] >= 0 && data[i - 1][key] < 0) {
        // Linear interpolation between year i-1 and year i
        const prev = data[i - 1][key];
        const curr = data[i][key];
        const fraction = -prev / (curr - prev);
        return Math.round(((i - 1) + fraction) * 10) / 10;
      }
    }
    return 0;
  };
  const cashPayback = interpolatePayback('cashSavings');
  const loanPayback = interpolatePayback('loanSavings');
  
  return (
    <Card className="border-2 border-blue-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">25-Year Savings Trajectory</CardTitle>
          </div>
          <Badge className="bg-blue-600 text-white text-xs">
            <DollarSign className="h-3 w-3 mr-1" />
            Lifetime Value
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Projected cumulative savings with {rateEscalation}% annual utility rate increase
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="leaseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="ppaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="year" 
              label={{ value: 'Years', position: 'insideBottom', offset: -2 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              label={{ value: 'Cumulative Savings ($)', angle: -90, position: 'insideLeft', dy: -10, style: { textAnchor: 'middle' } }}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              labelFormatter={(year) => `Year ${year}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
            
            {/* Cash Purchase */}
            <Area
              type="monotone"
              dataKey="cashSavings"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#cashGradient)"
              name="Cash Purchase"
            />
            
            {/* Loan */}
            <Area
              type="monotone"
              dataKey="loanSavings"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#loanGradient)"
              name="Solar Loan"
            />
            
            {/* Lease */}
            <Area
              type="monotone"
              dataKey="leaseSavings"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#leaseGradient)"
              name="Solar Lease"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Key Metrics */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Cash (25yr)</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">
              ${(data[25].cashSavings / 1000).toFixed(0)}k
            </p>
            {cashPayback > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ⏱ {cashPayback.toFixed(1)}yr payback
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Loan (25yr)</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              ${(data[25].loanSavings / 1000).toFixed(0)}k
            </p>
            {loanPayback > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                ⏱ {loanPayback.toFixed(1)}yr payback
              </p>
            )}
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Lease (25yr)</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
              ${(data[25].leaseSavings / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            ℹ️ Projections include {rateEscalation}% annual utility rate escalation and 0.5% annual system degradation. Consult a tax professional for personalized incentive and tax credit guidance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
