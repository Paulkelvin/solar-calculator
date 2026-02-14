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

const COLORS = {
  active: "#E67E22",
  inactive: "#F1F1F1",
  inactiveText: "#555555",
  labelMuted: "#999999",
  line: "#E0E0E0",
};

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
                  {/* Left connecting line */}
                  {idx > 0 && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] w-1/2">
                      <div
                        className="relative h-full w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: COLORS.line }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: COLORS.active,
                            width: `${segmentProgress(idx - 1) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Right connecting line */}
                  {idx < steps.length - 1 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[3px] w-1/2">
                      <div
                        className="relative h-full w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: COLORS.line }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: COLORS.active,
                            width: `${segmentProgress(idx) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Step circle */}
                  <div
                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
                    style={{
                      backgroundColor: isDone || isActive ? COLORS.active : COLORS.inactive,
                      color: isDone || isActive ? "#FFFFFF" : COLORS.inactiveText,
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    {isDone ? (
                      <Check className="h-5 w-5" strokeWidth={3} />
                    ) : (
                      <span className="font-bold">{idx + 1}</span>
                    )}
                  </div>
                </div>
                {/* Step label */}
                <span
                  className="mt-2 text-[10px] font-semibold transition-colors duration-300"
                  style={{
                    color: isActive
                      ? COLORS.active
                      : isDone
                        ? COLORS.inactiveText
                        : COLORS.labelMuted,
                  }}
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
