"use client";

import { useState } from "react";
import { usageSchema, type Usage } from "../../../../types/leads";

interface UsageStepProps {
  value?: Usage;
  onChange: (usage: Usage) => void;
}

export function UsageStep({ value, onChange }: UsageStepProps) {
  const [tab, setTab] = useState<"bill" | "kwh">(
    value?.billAmount ? "bill" : "kwh"
  );
  const [billAmount, setBillAmount] = useState(value?.billAmount || "");
  const [monthlyKwh, setMonthlyKwh] = useState(value?.monthlyKwh || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      validate({ billAmount: num });
    } else if (val === "") {
      setErrors({});
    }
  };

  const handleKwhChange = (val: string) => {
    setMonthlyKwh(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      validate({ monthlyKwh: num });
    } else if (val === "") {
      setErrors({});
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b border-border">
        <button
          className={`pb-2 text-sm font-medium transition-colors ${
            tab === "bill"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setTab("bill")}
        >
          By Monthly Bill
        </button>
        <button
          className={`pb-2 text-sm font-medium transition-colors ${
            tab === "kwh"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setTab("kwh")}
        >
          By kWh
        </button>
      </div>

      {tab === "bill" && (
        <div>
          <label className="block text-sm font-medium">Monthly Electric Bill ($)</label>
          <input
            type="number"
            value={billAmount}
            onChange={(e) => handleBillChange(e.target.value)}
            placeholder="120"
            className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.usage && (
            <p className="mt-1 text-xs text-red-600">{errors.usage}</p>
          )}
        </div>
      )}

      {tab === "kwh" && (
        <div>
          <label className="block text-sm font-medium">Monthly kWh Usage</label>
          <input
            type="number"
            value={monthlyKwh}
            onChange={(e) => handleKwhChange(e.target.value)}
            placeholder="900"
            className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.usage && (
            <p className="mt-1 text-xs text-red-600">{errors.usage}</p>
          )}
        </div>
      )}

      <div className="rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
        <p>
          {tab === "bill"
            ? "Tip: Check your last 12 months of bills for an average."
            : "Tip: Find kWh on your monthly utility statement."}
        </p>
      </div>
    </div>
  );
}
