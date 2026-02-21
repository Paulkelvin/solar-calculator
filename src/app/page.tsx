"use client";

import { useState } from "react";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";
import { ResultsView } from "@/components/results/ResultsView";
import { useAuth } from "@/contexts/auth";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { SolarCalculationResult } from "@/../types/calculations";
import type { CalculatorForm } from "@/../types/leads";

interface ResultsState {
  results: SolarCalculationResult;
  leadData: Partial<CalculatorForm>;
}

export default function HomePage() {
  const [resultsState, setResultsState] = useState<ResultsState | null>(null);
  const { session } = useAuth();

  const handleResults = (results: SolarCalculationResult, leadData: Partial<CalculatorForm>) => {
    setResultsState({ results, leadData });
  };

  return (
    <main className="h-full flex flex-col">
      <div className="w-full flex-none">
        <header className="text-center mb-2 md:mb-4 relative">
          {session.isAuthenticated && (
            <Link
              href="/dashboard"
              className="absolute left-0 top-0 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
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

      {/* Footer with Privacy Policy link */}
      <footer className="flex-none border-t border-gray-200 bg-white/80 backdrop-blur-sm py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>© 2026 Solar ROI Calculator</span>
          <Link href="/privacy" className="hover:text-amber-600 underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-amber-600 underline">Terms of Service</Link>
        </div>
      </footer>
    </main>
  );
}
