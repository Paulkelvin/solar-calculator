"use client";

import { Check } from "lucide-react";

export interface Step {
  id: string;
  label: string;
  order: number;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const segmentProgress = (segmentIdx: number) => {
    const value = currentStep - segmentIdx;
    if (value >= 1) return 1;
    if (value <= 0) return 0;
    return value;
  };

  return (
    <div className="w-full flex justify-center py-3">
      <div className="w-full max-w-3xl px-4">
        <div
          className="grid w-full gap-0"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center text-center py-1">
                <div className="relative flex w-full items-center justify-center py-1">
                  {idx > 0 && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] w-1/2">
                      <div className="relative h-full w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="absolute inset-y-0 left-0 bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${segmentProgress(idx - 1) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {idx < steps.length - 1 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[3px] w-1/2">
                      <div className="relative h-full w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="absolute inset-y-0 left-0 bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${segmentProgress(idx) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300
                      ${isDone
                        ? "text-white shadow-lg shadow-emerald-200 ring-4 ring-white"
                        : isActive
                          ? "text-white shadow-lg shadow-emerald-200 ring-4 ring-white"
                          : "text-gray-900 border-2 border-emerald-400 shadow-lg shadow-emerald-100"}`
                    }
                    style={{ backgroundColor: "#10b981" }}
                  >
                    {isDone ? (
                      <Check className="h-5 w-5" strokeWidth={3} />
                    ) : (
                      <span className="font-bold">{idx + 1}</span>
                    )}
                  </div>
                </div>
                <span
                  className={`mt-2 text-[10px] font-semibold transition-colors duration-300 ${
                    isActive ? "text-emerald-600" : isDone ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
