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
    <main className="h-full flex flex-col">
      <div className="w-full flex-none">
        <header className="text-center mb-2 md:mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            Solar ROI Calculator
          </h1>
          <p className="text-xs text-gray-600">
            Discover your solar savings potential
          </p>
        </header>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {resultsState ? (
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <ResultsView results={resultsState.results} leadData={resultsState.leadData} />
          </div>
        ) : (
          <CalculatorWizard onResults={handleResults} />
        )}
      </div>
    </main>
  );
}
