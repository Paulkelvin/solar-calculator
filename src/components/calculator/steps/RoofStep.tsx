"use client";

import { useState } from "react";
import { roofSchema, type Roof } from "../../../../types/leads";

interface RoofStepProps {
  value?: Roof;
  onChange: (roof: Roof) => void;
}

const ROOF_TYPES = [
  { id: "asphalt", label: "Asphalt Shingles" },
  { id: "metal", label: "Metal" },
  { id: "tile", label: "Tile" },
  { id: "flat", label: "Flat/Membrane" },
  { id: "other", label: "Other" }
];

const SUN_EXPOSURE = [
  { id: "poor", label: "Poor (mostly shaded)" },
  { id: "fair", label: "Fair (some shade)" },
  { id: "good", label: "Good (mostly sunny)" },
  { id: "excellent", label: "Excellent (full sun)" }
];

export function RoofStep({ value, onChange }: RoofStepProps) {
  const [formValue, setFormValue] = useState<Roof>(
    value || { roofType: "asphalt", squareFeet: 0, sunExposure: "good" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (updated: Roof) => {
    const result = roofSchema.safeParse(updated);
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

  const handleChange = (field: keyof Roof, val: unknown) => {
    const updated = { ...formValue, [field]: val };
    setFormValue(updated);
    validate(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-3">Roof Type</label>
        <div className="grid grid-cols-2 gap-2">
          {ROOF_TYPES.map((rt) => (
            <button
              key={rt.id}
              onClick={() => handleChange("roofType", rt.id)}
              className={`rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors ${
                formValue.roofType === rt.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              }`}
            >
              {rt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Roof Area (sq ft)</label>
        <input
          type="number"
          value={formValue.squareFeet}
          onChange={(e) => handleChange("squareFeet", parseInt(e.target.value) || 0)}
          placeholder="2500"
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.squareFeet && (
          <p className="mt-1 text-xs text-red-600">{errors.squareFeet}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Sun Exposure</label>
        <div className="space-y-2">
          {SUN_EXPOSURE.map((se) => (
            <button
              key={se.id}
              onClick={() => handleChange("sunExposure", se.id)}
              className={`w-full rounded-md border-2 px-3 py-2 text-left text-sm transition-colors ${
                formValue.sunExposure === se.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              }`}
            >
              {se.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: Detailed roof inspection and satellite imagery available in Phase 2.
      </p>
    </div>
  );
}
