"use client";

import { useState } from "react";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";
import { ResultsView } from "@/components/results/ResultsView";
import type { SolarCalculationResult } from "@/../types/calculations";
import type { CalculatorForm } from "@/../types/leads";

interface ResultsState {
  results: SolarCalculationResult;
  leadData: Partial<CalculatorForm>;
}

export default function HomePage() {
  const [resultsState, setResultsState] = useState<ResultsState | null>(null);

  const handleResults = (results: SolarCalculationResult, leadData: Partial<CalculatorForm>) => {
    setResultsState({ results, leadData });
  };

  return (
    <main className="space-y-6" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header className="space-y-2" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontSize: "1.875rem", fontWeight: 600, letterSpacing: "-0.02em" }}>Solar ROI Calculator</h1>
        <p className="text-sm text-muted-foreground" style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Phase 1 prototype — all numbers are mocked estimates only.
        </p>
      </header>

      <CalculatorWizard onResults={handleResults} />

      {resultsState && <ResultsView results={resultsState.results} leadData={resultsState.leadData} />}
    </main>
  );
}
