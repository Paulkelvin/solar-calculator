/**
 * System Design Variations Component
 * Display 3 system size options with ROI comparison
 */

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
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-xl mb-2">Step 1: Choose Your System Size</h3>
          <p className="text-sm text-muted-foreground">
            Select the solar system size that best fits your energy needs and budget. Larger systems produce more power but cost more upfront.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {options.map((option, idx) => {
            const isSelected = selectedOption?.name === option.name;

            return (
              <div
                key={idx}
                onClick={() => onSelect?.(option)}
                className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                {/* Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-lg font-bold">{option.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.percentageOfConsumption}% offset
                    </div>
                  </div>
                  {isSelected && (
                    <div className="rounded-full bg-primary/20 p-2">
                      <div className="text-primary text-sm">✓</div>
                    </div>
                  )}
                </div>

                {/* System Size */}
                <div className="mb-3 pb-3 border-b border-border">
                  <div className="text-2xl font-bold">{option.systemSizeKw} kW</div>
                  <div className="text-xs text-muted-foreground">System size</div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Production:</span>
                    <span className="font-medium">
                      {option.estimatedAnnualProduction.toLocaleString()} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium">
                      ${option.systemCostUSD.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Loan Payment:</span>
                    <span className="font-medium">
                      ${option.monthlyPaymentLoan.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ROI Section */}
                <div className="rounded-md bg-secondary p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-muted-foreground">25-Year ROI</div>
                      <div className="text-xl font-bold text-primary">
                        {option.roi25Year}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Payback</div>
                      <div className="text-lg font-bold">
                        {option.paybackYears.toFixed(1)}y
                      </div>
                    </div>
                  </div>
                </div>

                {/* First Year Savings */}
                <div className="rounded-md bg-green-50 px-3 py-2">
                  <div className="text-xs text-green-700">Year 1 Savings</div>
                  <div className="text-sm font-bold text-green-700">
                    ${option.firstYearSavings.toLocaleString()}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="mt-3 text-xs text-muted-foreground italic">
                  {option.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
