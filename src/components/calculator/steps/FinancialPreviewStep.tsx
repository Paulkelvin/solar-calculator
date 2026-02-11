"use client";

import { useMemo } from "react";
import { performSolarCalculation } from "@/lib/calculations/solar";
import type { Address, Usage, Roof, Preferences } from "../../../../types/leads";
import type { SolarData } from "../../../store/calculatorStore";
import { DollarSign, Leaf, PiggyBank, TrendingUp } from "lucide-react";

interface FinancialPreviewStepProps {
  address?: Address;
  usage?: Usage;
  roof?: Roof;
  preferences?: Preferences;
  solarSnapshot?: SolarData;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function FinancialPreviewStep({
  address,
  usage,
  roof,
  preferences,
  solarSnapshot,
}: FinancialPreviewStepProps) {
  const hasInputs = Boolean(
    address?.state &&
    roof?.squareFeet &&
    roof?.sunExposure &&
    (usage?.billAmount || usage?.monthlyKwh)
  );

  const preview = useMemo(() => {
    if (!hasInputs || !roof || !address) {
      return null;
    }

    return performSolarCalculation({
      monthlyKwh: usage?.monthlyKwh,
      billAmount: usage?.billAmount,
      roofSquareFeet: roof.squareFeet,
      sunExposure: roof.sunExposure,
      state: address.state,
      wantsBattery: Boolean(preferences?.wantsBattery),
    });
  }, [hasInputs, roof, usage?.monthlyKwh, usage?.billAmount, address, preferences?.wantsBattery]);

  const savingsRange = useMemo(() => {
    if (solarSnapshot?.estimatedSavingsRange) {
      return solarSnapshot.estimatedSavingsRange;
    }

    const monthlyBill = usage?.billAmount ?? (usage?.monthlyKwh ? usage.monthlyKwh * 0.14 : null);
    if (!monthlyBill) return null;

    const annualBill = monthlyBill * 12;
    const baseline = annualBill * 0.8; // 80% offset (matches performSolarCalculation)
    return {
      min: Math.round(baseline * 0.9),
      max: Math.round(baseline * 1.1),
    };
  }, [solarSnapshot?.estimatedSavingsRange, usage?.billAmount, usage?.monthlyKwh]);

  const financingCards = useMemo(() => {
    if (!preview) return [];
    return preview.financing.filter((opt) => opt.type === "cash" || opt.type === "loan").slice(0, 2);
  }, [preview]);

  if (!hasInputs) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
        Confirm your roof details and average bill to preview financing outcomes.
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="space-y-5">
      {savingsRange && (
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Projected year-one savings</p>
              <p className="text-3xl font-bold text-emerald-700">
                {currencyFormatter.format(savingsRange.min)} – {currencyFormatter.format(savingsRange.max)}
              </p>
              <p className="text-xs text-emerald-700">Based on your roof conditions and bill input. Phase 1 preview for planning.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricPill label="System Size" value={`${preview.systemSizeKw.toFixed(1)} kW`} icon={TrendingUp} accent="text-slate-600" />
        <MetricPill label="Annual Production" value={`${preview.estimatedAnnualProduction.toLocaleString()} kWh`} icon={Leaf} accent="text-green-600" />
        <MetricPill label="Monthly Avg" value={`${preview.estimatedMonthlyProduction.toLocaleString()} kWh`} icon={PiggyBank} accent="text-amber-600" />
        <MetricPill label="Carbon Offset" value={`${preview.environmental.annualCO2Offset.toLocaleString()} kg`} icon={Leaf} accent="text-emerald-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {financingCards.map((option) => (
          <div key={option.type} className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{option.type === "cash" ? "Cash Purchase" : "Solar Loan"}</p>
                <p className="text-xl font-semibold text-gray-900 capitalize">{option.type}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">Phase 1 preview</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {option.downPayment > 0 && (
                <DetailRow label="Upfront" value={currencyFormatter.format(option.downPayment)} />
              )}
              {option.monthlyPayment > 0 && (
                <DetailRow label="Monthly" value={currencyFormatter.format(Math.round(option.monthlyPayment))} />
              )}
              <DetailRow label="Break-even" value={`${option.payoffYears.toFixed(1)} yrs`} />
              <DetailRow label="25-yr ROI" value={`${option.roi.toFixed(0)}%`} highlight />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        Figures shown are preliminary and based on mocked Phase 1 calculations; actual incentives and payments will refresh on the final results screen.
      </div>
    </div>
  );
}

interface MetricPillProps {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  accent: string;
}

function MetricPill({ label, value, icon: Icon, accent }: MetricPillProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span>{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DetailRow({ label, value, highlight = false }: DetailRowProps) {
  return (
    <div className={`flex justify-between ${highlight ? "rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700" : "text-gray-700"}`}>
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
