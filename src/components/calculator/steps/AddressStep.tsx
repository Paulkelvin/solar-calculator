"use client";

import { useState, useRef, useEffect } from "react";
import { addressSchema, type Address } from "../../../../types/leads";
import {
  fetchPlacePredictions,
  fetchPlaceDetails,
  type PlacePrediction
} from "../../../lib/google-places";

interface AddressStepProps {
  value?: Address;
  onChange: (address: Address) => void;
}

export function AddressStep({ value, onChange }: AddressStepProps) {
  const [formValue, setFormValue] = useState<Address>(
    value || { street: "", city: "", state: "", zip: "" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [addressSelected, setAddressSelected] = useState(!!value?.city); // Track if address was selected
  const inputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);

  // Fetch predictions as user types
  const handleStreetInputChange = async (val: string) => {
    const updated = { ...formValue, street: val };
    setFormValue(updated);
    setApiError(null);

    // Validate other fields
    const result = addressSchema.safeParse(updated);
    if (result.success) {
      onChange(updated);
      setErrors({});
    } else {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        if (path !== "street") {
          fieldErrors[path] = err.message;
        }
      });
      setErrors(fieldErrors);
    }

    // Fetch predictions
    if (val.length > 2) {
      setIsLoadingPredictions(true);
      try {
        const preds = await fetchPlacePredictions(val);
        setPredictions(preds);
        setShowPredictions(true);
        setApiError(null);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Failed to fetch address suggestions. Please enter address manually.");
        setPredictions([]);
        setShowPredictions(false);
      } finally {
        setIsLoadingPredictions(false);
      }
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  // Handle prediction selection
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setShowPredictions(false);
    setIsLoadingPredictions(true);

    const details = await fetchPlaceDetails(prediction.placeId);

    if (details) {
      const updated = {
        street: details.street,
        city: details.city,
        state: details.state,
        zip: details.zip,
        latitude: details.latitude,
        longitude: details.longitude
      };
      setFormValue(updated);
      onChange(updated);
      setErrors({});
      setAddressSelected(true); // Show city/state/zip fields now
    }

    setIsLoadingPredictions(false);
  };

  // Close predictions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (field: keyof Address, val: string) => {
    if (field === "street") {
      handleStreetInputChange(val);
    } else {
      const updated = { ...formValue, [field]: val };
      setFormValue(updated);

      const result = addressSchema.safeParse(updated);
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
    }
  };

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          {apiError}
        </div>
      )}

      <div className="relative">
        <label className="block text-sm font-medium">Street Address</label>
        <input
          ref={inputRef}
          type="text"
          value={formValue.street}
          onChange={(e) => handleChange("street", e.target.value)}
          onFocus={() => predictions.length > 0 && setShowPredictions(true)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          placeholder="123 Main St or start typing an address..."
          autoComplete="off"
        />
        {errors.street && (
          <p className="mt-1 text-xs text-red-600">{errors.street}</p>
        )}

        {/* Predictions dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div
            ref={predictionsRef}
            className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-background shadow-lg"
          >
            {predictions.map((pred) => (
              <button
                key={pred.placeId}
                onClick={() => handleSelectPrediction(pred)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                <div className="font-medium">{pred.mainText}</div>
                {pred.secondaryText && (
                  <div className="text-xs text-muted-foreground">
                    {pred.secondaryText}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {isLoadingPredictions && (
          <p className="mt-1 text-xs text-muted-foreground">Loading...</p>
        )}
      </div>

      {/* City/State/ZIP - Only show after address is selected */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          addressSelected ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                type="text"
                value={formValue.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="Denver"
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-600">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">State</label>
              <input
                type="text"
                value={formValue.state}
                onChange={(e) => handleChange("state", e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-primary"
                placeholder="CO"
                maxLength={2}
              />
              {errors.state && (
                <p className="mt-1 text-xs text-red-600">{errors.state}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">ZIP Code</label>
            <input
              type="text"
              value={formValue.zip}
              onChange={(e) => handleChange("zip", e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="80202"
            />
            {errors.zip && (
              <p className="mt-1 text-xs text-red-600">{errors.zip}</p>
            )}
          </div>
        </div>
      </div>

      {!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
        <p className="mt-4 text-xs text-muted-foreground">
          💡 Add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to .env.local to enable address autocomplete
        </p>
      )}
    </div>
  );
}
