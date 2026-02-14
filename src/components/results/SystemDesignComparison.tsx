/**
 * System Design Variations Component
 * Compact 3-option system size selector with ROI comparison
 */

import { useState, useEffect } from "react";
import type { SystemDesignOption } from "@/lib/system-design-service";

interface SystemDesignComparisonProps {
  options: SystemDesignOption[];
  selectedOption?: SystemDesignOption;
  onSelect?: (option: SystemDesignOption) => void;
}

export function SystemDesignComparison({
  options,
  selectedOption,
  onSelect
}: SystemDesignComparisonProps) {
  const [toast, setToast] = useState<string | null>(null);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!options || options.length === 0) {
    return null;
  }

  // Badge colors for each tier
  const tierStyles: Record<number, { badge: string; badgeBg: string; accent: string }> = {
    0: { badge: "Starter", badgeBg: "bg-blue-100 text-blue-700", accent: "border-blue-300" },
    1: { badge: "Recommended", badgeBg: "bg-emerald-100 text-emerald-700", accent: "border-emerald-400" },
    2: { badge: "Max Savings", badgeBg: "bg-amber-100 text-amber-700", accent: "border-amber-400" },
  };

  const handleSelect = (option: SystemDesignOption) => {
    onSelect?.(option);
    setToast(`Your estimate has been updated to the ${option.systemSizeKw} kW ${option.name} system — all costs and savings below now reflect this selection.`);
  };

  return (
    <div className="relative">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white px-5 py-4 shadow-xl">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">✓</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">System updated</p>
              <p className="mt-0.5 text-xs text-gray-600">{toast}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      <div className="mb-4 text-center">
        <h3 className="font-semibold text-lg">Choose Your System Size</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select the option that best fits your budget and energy goals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {options.map((option, idx) => {
          const isSelected = selectedOption?.name === option.name;
          const tier = tierStyles[idx] || tierStyles[0];
          const isRecommended = idx === 1;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(option)}
              className={`relative rounded-xl border-2 px-5 py-6 text-left transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-1 ring-emerald-200'
                  : `${tier.accent} hover:shadow-sm hover:border-emerald-300`
              }`}
            >
              {/* Tier badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tier.badgeBg}`}>
                  {tier.badge}
                </span>
                {isSelected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">✓</span>
                )}
                {isRecommended && !isSelected && (
                  <span className="text-[10px] text-emerald-600 font-medium">★ Best value</span>
                )}
              </div>

              {/* Primary metric: system size + offset */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">{option.systemSizeKw} kW</span>
                <span className="text-xs text-muted-foreground">
                  ≈ {option.percentageOfConsumption}% offset
                </span>
              </div>

              {/* Key numbers in compact grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-semibold">${option.systemCostUSD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payback</span>
                  <span className="font-semibold">{option.paybackYears.toFixed(1)} yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mo. loan</span>
                  <span className="font-semibold">${option.monthlyPaymentLoan.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">25yr ROI</span>
                  <span className="font-semibold text-emerald-600">{option.roi25Year}%</span>
                </div>
              </div>

              {/* Annual production */}
              <div className="text-xs text-muted-foreground mb-3">
                Est. {option.estimatedAnnualProduction.toLocaleString()} kWh/year
              </div>

              {/* Year 1 savings highlight */}
              <div className="rounded-lg bg-green-50 px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-green-700">Year 1 savings</span>
                <span className="text-sm font-bold text-green-700">${option.firstYearSavings.toLocaleString()}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
