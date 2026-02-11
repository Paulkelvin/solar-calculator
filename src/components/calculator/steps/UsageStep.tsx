"use client";

import { useState, useEffect } from "react";
import { usageSchema, type Usage } from "../../../../types/leads";
import { useCalculatorStore } from "../../../store/calculatorStore";
import { Zap, DollarSign, Loader2 } from "lucide-react";
import { LiveProductionPreview } from "../LiveProductionPreview";

const BILL_DEBOUNCE_MS = 300;
const KWH_STOP_TYPING_MS = 600;
const ENERGY_PROFILE_SPINNER_MS = 500;
interface UsageStepProps {
  value?: Usage;
  onChange: (usage: Usage) => void;
}

export function UsageStep({ value, onChange }: UsageStepProps) {
  const [activeTab, setActiveTab] = useState<"bill" | "kwh">(
    value?.billAmount ? "bill" : "kwh"
  );
  const [billAmount, setBillAmount] = useState(value?.billAmount?.toString() || "");
  const [monthlyKwh, setMonthlyKwh] = useState(value?.monthlyKwh?.toString() || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Live estimates
  const [annualKwh, setAnnualKwh] = useState<number | null>(null);
  const [annualCost, setAnnualCost] = useState<number | null>(null);
  const [averageRate, setAverageRate] = useState<number>(0.14); // Default $0.14/kWh
  const [isEnergyProfileLoading, setIsEnergyProfileLoading] = useState(false);
  const [showEnergyProfile, setShowEnergyProfile] = useState(false);
  const [nrelStatus, setNrelStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

  const { setUsage, solarData, shouldSuggestBattery } = useCalculatorStore();

  // Debounced calculation + loading choreography
  useEffect(() => {
    let typingTimer: ReturnType<typeof setTimeout> | null = null;
    let processingTimer: ReturnType<typeof setTimeout> | null = null;

    // Reset NREL status so stale 'ready' state doesn't flash the profile
    setNrelStatus('idle');

    const resetProfile = () => {
      setAnnualKwh(null);
      setAnnualCost(null);
      setShowEnergyProfile(false);
      setIsEnergyProfileLoading(false);
    };

    if (activeTab === "bill") {
      if (!billAmount) {
        resetProfile();
      } else {
        typingTimer = setTimeout(() => {
          const bill = parseFloat(billAmount);
          if (!isNaN(bill) && bill > 0) {
            const estimatedMonthlyKwh = bill / averageRate;
            const estimatedAnnualKwh = Math.round(estimatedMonthlyKwh * 12);
            setAnnualKwh(estimatedAnnualKwh);
            setAnnualCost(Math.round(bill * 12));
            setIsEnergyProfileLoading(false);
            setShowEnergyProfile(true);

            setUsage({
              monthlyBill: bill,
              monthlyKwh: estimatedMonthlyKwh,
              annualKwh: estimatedAnnualKwh,
              averageRate,
            });
          } else {
            resetProfile();
          }
        }, BILL_DEBOUNCE_MS);
      }
    } else {
      if (!monthlyKwh) {
        resetProfile();
      } else {
        setShowEnergyProfile(false);
        setIsEnergyProfileLoading(false);
        typingTimer = setTimeout(() => {
          const kwh = parseFloat(monthlyKwh);
          if (!isNaN(kwh) && kwh > 0) {
            setIsEnergyProfileLoading(true);
            processingTimer = setTimeout(() => {
              const estimatedAnnualKwh = Math.round(kwh * 12);
              const estimatedMonthlyCost = kwh * averageRate;
              setAnnualKwh(estimatedAnnualKwh);
              setAnnualCost(Math.round(estimatedMonthlyCost * 12));
              setIsEnergyProfileLoading(false);
              setShowEnergyProfile(true);

              setUsage({
                monthlyKwh: kwh,
                monthlyBill: estimatedMonthlyCost,
                annualKwh: estimatedAnnualKwh,
                averageRate,
              });
            }, ENERGY_PROFILE_SPINNER_MS);
          } else {
            resetProfile();
          }
        }, KWH_STOP_TYPING_MS);
      }
    }

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
      if (processingTimer) clearTimeout(processingTimer);
    };
  }, [billAmount, monthlyKwh, activeTab, averageRate, setUsage]);

  const handleTabSelect = (target: "bill" | "kwh") => {
    setActiveTab(target);
    // Clear the other field so only one input drives calculations
    if (target === "bill") {
      setMonthlyKwh("");
    } else {
      setBillAmount("");
    }
  };

  const validate = (data: Partial<Usage>) => {
    const result = usageSchema.safeParse(data);
    if (result.success) {
      onChange(result.data);
      setErrors({});
      return true;
    } else {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors["usage"] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleBillChange = (val: string) => {
    setBillAmount(val);
    setActiveTab("bill");
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      validate({ billAmount: num });
    } else if (val === "") {
      setErrors({});
    }
  };

  const handleKwhChange = (val: string) => {
    setMonthlyKwh(val);
    setActiveTab("kwh");
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      validate({ monthlyKwh: num });
    } else if (val === "") {
      setErrors({});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="flex w-full max-w-md items-center gap-2 rounded-full bg-gray-100 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => handleTabSelect("bill")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
              activeTab === "bill"
                ? "bg-white text-emerald-600 shadow-md shadow-emerald-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Monthly Bill</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect("kwh")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
              activeTab === "kwh"
                ? "bg-white text-emerald-600 shadow-md shadow-emerald-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>kWh Usage</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/80 shadow-sm">
        <div
          className={`flex w-[200%] transform transition-transform duration-500 ease-out ${
            activeTab === "bill" ? "translate-x-0" : "-translate-x-1/2"
          }`}
        >
          <section className="w-1/2 flex-shrink-0 px-4 py-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Average monthly bill ($)</label>
            <input
              type="number"
              value={billAmount}
              onChange={(e) => handleBillChange(e.target.value)}
              placeholder="120"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
            />
            {errors.usage && <p className="mt-1 text-xs text-red-600">{errors.usage}</p>}
          </section>

          <section className="w-1/2 flex-shrink-0 px-4 py-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Average monthly kWh</label>
            <input
              type="number"
              value={monthlyKwh}
              onChange={(e) => handleKwhChange(e.target.value)}
              placeholder="900"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
            />
            {errors.usage && <p className="mt-1 text-xs text-red-600">{errors.usage}</p>}
          </section>
        </div>
      </div>

      <div className="-mt-2 flex items-start gap-2 text-[11px] text-gray-500">
        <span className="pt-0.5 text-emerald-500">💡</span>
        <span>
          {activeTab === "bill"
            ? "Grab your last 12 statements and average the total charges."
            : "Monthly kWh lives in the usage section of every utility bill."}
        </span>
      </div>

      {/* Hidden renderer — keeps NREL fetching in background, reports status */}
      <div className="hidden">
        <LiveProductionPreview onStatusChange={setNrelStatus} />
      </div>

      {/* Show combined loading while either local calc or NREL is pending - with minimum display time */}
      {(isEnergyProfileLoading || (showEnergyProfile && annualKwh && nrelStatus === 'loading')) && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1">
            What You Pay Now (Without Solar)
          </h3>
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-700 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            <span className="animate-pulse">Crunching usage trends &amp; fetching solar production data…</span>
          </div>
        </div>
      )}

      {/* Only reveal everything once BOTH local calc AND NREL are done */}
      {showEnergyProfile && annualKwh && annualCost && nrelStatus === 'ready' && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1">
            What You Pay Now (Without Solar)
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Your Annual Usage</p>
              <p className="text-lg font-bold text-blue-900">{annualKwh.toLocaleString()}</p>
              <p className="text-xs text-blue-600">kWh you consume yearly</p>
            </div>

            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-xs text-green-700 mb-1">Your Annual Cost</p>
              <p className="text-lg font-bold text-green-900">${annualCost.toLocaleString()}</p>
              <p className="text-xs text-green-600">what you pay now</p>
            </div>
          </div>

          {solarData?.solarScore && (
            <div className="p-3 bg-purple-50 rounded border border-purple-200">
              <p className="text-xs text-purple-700 mb-1">Recommended Solar System</p>
              <p className="text-lg font-bold text-purple-900">{Math.round((annualKwh / 1200) * 10) / 10} kW</p>
              <p className="text-xs text-purple-600">Replaces ~{Math.round(((solarData?.sunExposurePercentage || 80) * 0.9))}% of your electricity bill</p>
            </div>
          )}

          {shouldSuggestBattery() && (
            <div className="p-2 bg-amber-50 rounded border border-amber-300">
              <p className="text-xs font-medium text-amber-900">🔋 Battery Storage Recommended</p>
              <p className="text-xs text-amber-700 mt-1">Save an additional 15-20% with battery storage.</p>
            </div>
          )}

          {/* Live Production Preview — lands with energy profile */}
          <div className="mt-4">
            <LiveProductionPreview />
          </div>
        </div>
      )}
    </div>
  );
}
