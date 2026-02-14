"use client";

import { useState, useEffect } from "react";
import { preferencesSchema, type Preferences } from "../../../../types/leads";

interface PreferencesStepProps {
  value?: Preferences;
  onChange: (preferences: Preferences) => void;
}

export function PreferencesStep({ value, onChange }: PreferencesStepProps) {
  const [formValue, setFormValue] = useState<Preferences>(
    value || {
      wantsBattery: false,
      financingType: "cash",
      timeline: "immediate",
      notes: ""
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!value) {
      onChange(formValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value) {
      setFormValue(value);
    }
  }, [value]);

  const validate = (updated: Preferences) => {
    const result = preferencesSchema.safeParse(updated);
    if (result.success) {
      onChange(updated);
      setErrors({});
    } else {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
    }
  };

  const handleChange = (field: keyof Preferences, val: unknown) => {
    const updated = { ...formValue, [field]: val };
    setFormValue(updated);
    validate(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formValue.wantsBattery}
            onChange={(e) => handleChange("wantsBattery", e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm font-medium">Interested in battery storage?</span>
        </label>
      </div>

      {/* Financing + Timeline side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Financing Preference</label>
          <p className="text-xs text-muted-foreground mb-2">Helps us prepare a tailored financing preview.</p>
          <div className="space-y-2">
            {[
              { id: "cash", label: "Cash Purchase" },
              { id: "loan", label: "Loan/Financing" },
              { id: "lease", label: "Lease/PPA" }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleChange("financingType", opt.id)}
                className={`w-full rounded-md border-2 px-3 py-2 text-left text-sm transition-colors ${
                  formValue.financingType === opt.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">When do you plan to install?</label>
          <p className="text-xs text-muted-foreground mb-2">Helps prioritize your quote and scheduling.</p>
          <div className="space-y-2">
            {[
              { id: "immediate", label: "Immediate (0-1 month)" },
              { id: "3-months", label: "3 Months" },
              { id: "6-months", label: "6 Months" },
              { id: "12-months", label: "12+ Months" }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleChange("timeline", opt.id)}
                className={`w-full rounded-md border-2 px-3 py-2 text-left text-sm transition-colors ${
                  formValue.timeline === opt.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Additional Notes (optional)</label>
        <textarea
          value={formValue.notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Any other preferences or questions..."
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          rows={4}
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
        )}
      </div>
    </div>
  );
}
