"use client";

import { useState, useEffect, useMemo } from "react";
import type { SolarCalculationResult } from "../../../types/calculations";
import type { CalculatorForm } from "../../../types/leads";
import { fetchSolarData } from "@/lib/solar-service";
import type { SolarDataResponse } from "@/lib/solar-service";
import { generateSystemDesignOptions } from "@/lib/system-design-service";
import type { SystemDesignOption } from "@/lib/system-design-service";
import { calculateFinancing, calculateEnvironmental, BASE_ELECTRICITY_RATE, AVG_PRODUCTION_PER_KW, SYSTEM_COST_PER_WATT, FIXED_INSTALL_OVERHEAD, getSunFactor } from "@/lib/calculations/solar";
import { SystemDesignComparison } from "./SystemDesignComparison";
import { RoofImageryViewer } from "./RoofImageryViewer";
import { CashFlowChart } from "./CashFlowChart";
import { BillOffsetChart, EnvironmentalImpactChart } from "./EnvironmentalCharts";
import { WhatIfSliders } from "./WhatIfSliders";
import { useCalculatorStore } from "@/store/calculatorStore";

interface ResultsViewProps {
  results: SolarCalculationResult;
  leadData?: Partial<CalculatorForm>;
}

export function ResultsView({ results, leadData }: ResultsViewProps) {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [solarData, setSolarData] = useState<SolarDataResponse | null>(null);
  const [solarLoading, setSolarLoading] = useState(false);
  const [solarError, setSolarError] = useState<string | null>(null);
  const [systemDesignOptions, setSystemDesignOptions] = useState<SystemDesignOption[]>([]);
  const [selectedDesignOption, setSelectedDesignOption] = useState<SystemDesignOption | null>(null);
  const { solarData: solarScoreData } = useCalculatorStore();

  // Fetch real solar data when component mounts and coordinates are available
  useEffect(() => {
    const loadSolarData = async () => {
      const latitude = leadData?.address?.latitude;
      const longitude = leadData?.address?.longitude;

      if (!latitude || !longitude) {
        console.log('No coordinates available for solar data');
        return;
      }

      setSolarLoading(true);
      setSolarError(null);

      try {
        const data = await fetchSolarData(latitude, longitude);
        setSolarData(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch solar data';
        setSolarError(errorMessage);
        console.error('Solar data fetch error:', error);
      } finally {
        setSolarLoading(false);
      }
    };

    loadSolarData();
  }, [leadData?.address?.latitude, leadData?.address?.longitude]);

  // Compute actual annual consumption — derive from billAmount when monthlyKwh is missing
  const annualConsumption = useMemo(() => {
    if (leadData?.usage?.monthlyKwh && leadData.usage.monthlyKwh > 0) {
      return Math.round(leadData.usage.monthlyKwh * 12);
    }
    if (leadData?.usage?.billAmount && leadData.usage.billAmount > 0) {
      return Math.round((leadData.usage.billAmount / BASE_ELECTRICITY_RATE) * 12);
    }
    return 12000; // safe fallback
  }, [leadData?.usage?.monthlyKwh, leadData?.usage?.billAmount]);

  // Generate system design options when component mounts and data is available
  useEffect(() => {
    const generateDesignOptions = () => {
      if (annualConsumption === 0) {
        console.log('No consumption data available for system design');
        return;
      }

      // Derive sunFactor using centralized helper (eliminates duplication)
      const sunFactor = solarData
        ? getSunFactor({ sunExposurePercentage: solarData.sunExposurePercentage })
        : 1.0;
      
      const state = leadData?.address?.state || 'CA';
      const roofSqft = solarData?.roofAreaSqft || leadData?.roof?.squareFeet;

      // Pass Google Solar's actual capacity cap and production-per-kW
      // so design tiers use the same constraints as the results
      const googleMaxKw = solarData?.source === 'real' && solarData.panelCapacityWatts
        ? solarData.panelCapacityWatts / 1000
        : undefined;
      const googleProdPerKw = solarData?.source === 'real' && solarData.panelCapacityWatts && solarData.estimatedAnnualKwh
        ? solarData.estimatedAnnualKwh / (solarData.panelCapacityWatts / 1000)
        : undefined;

      try {
        const options = generateSystemDesignOptions(
          annualConsumption, sunFactor, state, roofSqft,
          googleMaxKw, googleProdPerKw
        );
        setSystemDesignOptions(options);
        
        // Select the first option (Standard) by default
        if (options.length > 0) {
          setSelectedDesignOption(options[1] || options[0]);
        }
      } catch (error) {
        console.error('System design generation error:', error);
      }
    };

    generateDesignOptions();
  }, [annualConsumption, solarData?.sunExposurePercentage, solarData?.roofAreaSqft, solarData?.panelCapacityWatts, solarData?.estimatedAnnualKwh, solarData?.source, leadData?.address?.state, leadData?.roof?.squareFeet]);

  // === UNIFIED RESULTS ===
  // The `results` object from CalculatorWizard already has Google Solar baked in
  // via performSolarCalculation(input, googleSolar). This memo provides a secondary
  // override for when the ResultsView's own solarData fetch returns real data
  // (in case the wizard didn't have it yet, or for the re-fetch on results page).
  const effectiveResults = useMemo(() => {
    if (!solarData || solarData.source === 'mock') return results;

    // Real Google Solar data → use its actual production ratio
    const googleMaxKw = solarData.panelCapacityWatts / 1000;
    const realSystemSizeKw = Math.min(results.systemSizeKw, googleMaxKw);

    const googleProdPerKw = googleMaxKw > 0
      ? solarData.estimatedAnnualKwh / googleMaxKw
      : AVG_PRODUCTION_PER_KW;
    const realAnnualProduction = Math.round(realSystemSizeKw * googleProdPerKw);
    const realMonthlyProduction = Math.round(realAnnualProduction / 12);

    // Derive effective sunFactor so calculateFinancing uses Google Solar production
    const effectiveSunFactor = googleProdPerKw / AVG_PRODUCTION_PER_KW;

    const financingData = calculateFinancing(realSystemSizeKw, effectiveSunFactor);
    const environmental = calculateEnvironmental(realSystemSizeKw, realAnnualProduction, annualConsumption);

    const financing = [
      {
        type: "cash" as const,
        totalCost: financingData.totalSystemCost,
        downPayment: financingData.totalSystemCost,
        monthlyPayment: 0,
        totalInterest: 0,
        payoffYears: financingData.cash.yearsToBreakEven,
        roi: financingData.cash.roi25Years,
        description: "Pay upfront, own your system from day 1"
      },
      {
        type: "loan" as const,
        totalCost: financingData.totalSystemCost,
        downPayment: financingData.loan.downPayment,
        monthlyPayment: financingData.loan.monthlyPayment,
        totalInterest: financingData.loan.totalInterest,
        payoffYears: financingData.loan.yearsToBreakEven,
        roi: financingData.loan.roi25Years,
        description: "Finance with competitive rates, own after payoff"
      },
      {
        type: "lease" as const,
        totalCost: financingData.lease.totalCost,
        downPayment: 0,
        monthlyPayment: financingData.lease.monthlyPayment,
        totalInterest: 0,
        payoffYears: financingData.lease.yearsToBreakEven,
        roi: financingData.lease.roi20Years,
        leaseDownPayment: 0,
        leaseMonthlyPayment: financingData.lease.monthlyPayment,
        leaseTermYears: financingData.lease.termYears,
        description: "Zero down, predictable monthly payment"
      },
      {
        type: "ppa" as const,
        totalCost: financingData.ppa.totalCost,
        downPayment: 0,
        monthlyPayment: financingData.ppa.monthlyPayment,
        totalInterest: 0,
        payoffYears: 25,
        roi: financingData.ppa.roi25Years,
        ppaRatePerKwh: financingData.ppa.ratePerKwh,
        ppaEscalatorPercent: financingData.ppa.escalator * 100,
        ppaSavings25Year: financingData.ppa.savings25Year,
        description: "Pay for power produced, guaranteed savings"
      }
    ];

    return {
      ...results,
      systemSizeKw: Math.round(realSystemSizeKw * 100) / 100,
      estimatedAnnualProduction: Math.round(realAnnualProduction),
      estimatedMonthlyProduction: Math.round(realMonthlyProduction),
      financing,
      environmental,
    };
  }, [results, solarData, annualConsumption]);

  const handleDownloadPDF = async () => {
    if (!leadData) {
      alert("Lead data not available for PDF generation");
      return;
    }

    setIsDownloadingPDF(true);

    try {
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadData: {
            name: leadData.contact?.name || "Unknown",
            email: leadData.contact?.email || "unknown@example.com",
            phone: leadData.contact?.phone || "N/A",
            address: {
              street: leadData.address?.street || "",
              city: leadData.address?.city || "",
              state: leadData.address?.state || "",
              zip: leadData.address?.zip || ""
            },
            usage: {
              monthlyBill: leadData.usage?.billAmount,
              annualKwh: annualConsumption
            },
            roof: {
              size: leadData.roof?.squareFeet || 0,
              sunExposure: leadData.roof?.sunExposure || "Unknown"
            },
            preferences: {
              battery: leadData.preferences?.wantsBattery || false,
              financing: leadData.preferences?.financingType || "Cash",
              timeline: leadData.preferences?.timeline || "Unknown",
              notes: leadData.preferences?.notes
            }
          },
          calculations: results
        })
      });

      if (!response.ok) {
        throw new Error("PDF generation failed");
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "solar-proposal.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error:", error);
      alert("Failed to download PDF: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* System Overview with Real Solar Data */}
      <div className="rounded-lg border border-border bg-background p-6">
        <div className="mb-4 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 inline-block">
          {solarData?.source === 'real' ? 'Real Solar Data' : 'Estimated — Phase 1'}
        </div>

        <h2 className="text-2xl font-semibold">Your Solar ROI Estimate</h2>

        {/* Loading state */}
        {solarLoading && (
          <div className="mt-4 flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Fetching real solar data...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {solarError && !solarLoading && (
          <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            <p className="font-medium">Couldn't fetch real solar data</p>
            <p className="text-xs text-amber-600">Using estimated values instead</p>
          </div>
        )}

        {/* Display data (real or mock) */}
        {!solarLoading && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">System Size</p>
              <p className="mt-1 text-2xl font-bold">
                {effectiveResults.systemSizeKw.toFixed(1)} kW
              </p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Annual Production</p>
              <p className="mt-1 text-2xl font-bold">
                {effectiveResults.estimatedAnnualProduction.toLocaleString()} kWh
              </p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Monthly Avg</p>
              <p className="mt-1 text-2xl font-bold">
                {effectiveResults.estimatedMonthlyProduction.toLocaleString()} kWh
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Roof Imagery & Solar Potential Heatmap */}
      <RoofImageryViewer
        address={`${leadData?.address?.street}, ${leadData?.address?.city}, ${leadData?.address?.state}`}
        coordinates={
          leadData?.address?.latitude && leadData?.address?.longitude
            ? { lat: leadData.address.latitude, lng: leadData.address.longitude }
            : undefined
        }
        solarPotentialKwhAnnual={effectiveResults.estimatedAnnualProduction}
        roofImageryUrl={undefined}
      />

      {/* Solar Potential Metrics - REAL DATA */}
      {!solarLoading && solarData && (
        <div className="rounded-lg border border-border bg-background p-6">
          <h3 className="font-semibold">Solar Potential Analysis</h3>
          
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Potential</p>
              <p className="mt-2 text-lg font-bold capitalize">
                {solarData.solarPotential === 'high' && '⭐⭐⭐'}
                {solarData.solarPotential === 'medium' && '⭐⭐'}
                {solarData.solarPotential === 'low' && '⭐'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {solarData.solarPotential.charAt(0).toUpperCase() + solarData.solarPotential.slice(1)}
              </p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Roof Area</p>
              <p className="mt-2 text-lg font-bold">{solarData.roofAreaSqft.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">sq ft</p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Sun Exposure</p>
              <p className="mt-2 text-lg font-bold">{solarData.sunExposurePercentage}%</p>
              <p className="text-xs text-muted-foreground">exposed to sun</p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Shading</p>
              <p className="mt-2 text-lg font-bold">{solarData.shadingPercentage}%</p>
              <p className="text-xs text-muted-foreground">average</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-md bg-blue-50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Data Confidence:</span>
            <span className="font-semibold text-blue-700">{solarData.confidence}%</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900">Step 2: Choose Your Financing Path</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare payment options for your selected system size. The system size from Step 1 determines these costs.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {effectiveResults.financing.filter(f => f.type !== "ppa").map((opt, idx) => {
            const isPopular = opt.type === "loan";
            const typeLabels: Record<string, { title: string; tagline: string }> = {
              cash: { title: "Cash Purchase", tagline: "Own your system outright from day one." },
              loan: { title: "Solar Loan", tagline: "Spread the cost with competitive financing." },
              lease: { title: "Solar Lease", tagline: "Go solar with zero upfront investment." },
              ppa: { title: "Power Purchase", tagline: "Pay only for the energy your panels produce." },
            };
            const info = typeLabels[opt.type] || { title: opt.type, tagline: "" };

            // Build feature list
            const features: string[] = [];
            if (opt.type === "cash") {
              features.push(
                `Upfront: $${Math.round(opt.downPayment).toLocaleString()}`,
                "Full ownership immediately",
                "No monthly payments",
                `Break-even: ${opt.payoffYears.toFixed(1)} years`,
                `${opt.roi.toFixed(0)}% ROI over 25 years`
              );
            } else if (opt.type === "loan") {
              features.push(
                `${opt.downPayment > 0 ? `Down: $${Math.round(opt.downPayment).toLocaleString()}` : "$0 down"}`,
                `Interest: $${Math.round(opt.totalInterest).toLocaleString()}`,
                "Full ownership after term",
                `Break-even: ${opt.payoffYears.toFixed(1)} years`,
                `${opt.roi.toFixed(0)}% ROI over 25 years`
              );
            } else if (opt.type === "lease") {
              features.push(
                "$0 down payment",
                `${opt.leaseTermYears || 20}-year lease term`,
                "Maintenance included",
                `Break-even: ${opt.payoffYears.toFixed(1)} years`,
                `${opt.roi.toFixed(0)}% ROI over 20 years`
              );
            } else if (opt.type === "ppa") {
              features.push(
                "$0 down payment",
                `Rate: $${opt.ppaRatePerKwh?.toFixed(3) || "0.10"}/kWh`,
                `${opt.ppaEscalatorPercent?.toFixed(1) || "2.5"}% annual escalation`,
                opt.ppaSavings25Year ? `25yr savings: $${opt.ppaSavings25Year.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `${opt.roi.toFixed(0)}% ROI over 25 years`,
                "No maintenance costs"
              );
            }

            return (
              <div
                key={idx}
                className={`relative flex flex-col rounded-2xl border-2 p-6 transition-shadow hover:shadow-lg ${
                  isPopular
                    ? "border-emerald-500 bg-white shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h4 className={`text-xl font-bold ${isPopular ? "text-emerald-700" : "text-gray-900"}`}>
                    {info.title}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground leading-snug">
                    {info.tagline}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {opt.monthlyPayment > 0
                        ? `$${Math.round(opt.monthlyPayment).toLocaleString()}`
                        : `$${Math.round(opt.downPayment).toLocaleString()}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {opt.monthlyPayment > 0 ? "/month" : " total"}
                    </span>
                  </div>
                </div>

                <ul className="mb-6 flex-1 space-y-3">
                  {features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="mt-0.5 h-4 w-4 flex-none text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
                    isPopular
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md"
                      : "border-2 border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                  onClick={() => {
                    // Scroll to download section
                    document.getElementById("download-report")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Select {info.title.split(" ")[0]}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Incentives Section */}
      {results.incentives && (
        <div className="rounded-lg border border-border bg-background p-6">
          <h3 className="font-semibold">Available Incentives & Savings</h3>
          
          <div className="mt-3 rounded-md bg-blue-50 p-3 text-xs text-blue-700">
            <p className="font-medium">ℹ️ {results.incentives.disclaimer}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">First-Year Incentives</p>
              <p className="mt-2 text-lg font-bold">
                ${results.incentives.totalFirstYearIncentives.toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}
              </p>
              <p className="text-xs text-muted-foreground">rebates & credits</p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Annual Net Metering</p>
              <p className="mt-2 text-lg font-bold">
                ${results.incentives.netMeteringAnnualValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}
              </p>
              <p className="text-xs text-muted-foreground">electricity savings</p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Annual Benefits</p>
              <p className="mt-2 text-lg font-bold">
                ${(results.incentives.annualIncentives + results.incentives.netMeteringAnnualValue).toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}
              </p>
              <p className="text-xs text-muted-foreground">total first year</p>
            </div>
          </div>

          {results.incentives.availableIncentives.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Available in {results.incentives.state}:</p>
              <ul className="space-y-1">
                {results.incentives.availableIncentives.map((incentive, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground">
                    ✓ {incentive}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* System Design Comparison */}
      {systemDesignOptions.length > 0 && (
        <div className="rounded-lg border border-border bg-background p-6">
          <SystemDesignComparison 
            options={systemDesignOptions}
            selectedOption={selectedDesignOption}
            onSelect={setSelectedDesignOption}
          />
        </div>
      )}

      <div className="rounded-lg border border-border bg-background p-6">
        <h3 className="font-semibold">Environmental Impact</h3>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">CO₂ Offset (Annual)</p>
            <p className="mt-2 text-2xl font-bold">
              {effectiveResults.environmental.annualCO2Offset.toLocaleString(undefined, {
                maximumFractionDigits: 0
              })}
            </p>
            <p className="text-xs text-muted-foreground">kg/year</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Trees Equivalent</p>
            <p className="mt-2 text-2xl font-bold">
              {effectiveResults.environmental.treesEquivalent}
            </p>
            <p className="text-xs text-muted-foreground">trees/year</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Grid Independence</p>
            <p className="mt-2 text-2xl font-bold">
              {effectiveResults.environmental.gridIndependence}%
            </p>
            <p className="text-xs text-muted-foreground">of consumption</p>
          </div>
        </div>
      </div>

      {/* 25-Year Cash Flow Projections */}
      <CashFlowChart
        systemCost={FIXED_INSTALL_OVERHEAD + effectiveResults.systemSizeKw * 1000 * SYSTEM_COST_PER_WATT}
        annualSavings={effectiveResults.estimatedAnnualProduction * BASE_ELECTRICITY_RATE}
        loanMonthlyPayment={effectiveResults.financing.find(f => f.type === 'loan')?.monthlyPayment || 150}
        loanDownPayment={effectiveResults.financing.find(f => f.type === 'loan')?.downPayment || 0}
        leaseMonthlyPayment={effectiveResults.financing.find(f => f.type === 'lease')?.monthlyPayment || 120}
        ppaRate={effectiveResults.financing.find(f => f.type === 'ppa')?.ppaRatePerKwh || 0.10}
        annualProduction={effectiveResults.estimatedAnnualProduction}
        utilityRate={BASE_ELECTRICITY_RATE}
        rateEscalation={2.5}
      />

      {/* Environmental Impact & Bill Offset Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        <div className="min-w-0">
        <BillOffsetChart
          offsetPercentage={
            Math.min(100, Math.round((effectiveResults.estimatedAnnualProduction / annualConsumption) * 100)) || 85
          }
          annualConsumption={annualConsumption}
          annualProduction={effectiveResults.estimatedAnnualProduction}
        />
        </div>

        <div className="min-w-0">
        <EnvironmentalImpactChart
          annualProduction={effectiveResults.estimatedAnnualProduction}
          annualConsumption={annualConsumption}
          co2OffsetTons={(effectiveResults.estimatedAnnualProduction * 0.0004) || 5.6}
          treesEquivalent={Math.round((effectiveResults.estimatedAnnualProduction * 0.0004 / 0.02) || 220)}
        />
        </div>
      </div>

      {/* What-If Analysis Sliders - Hidden for user simplicity */}
      {/* <WhatIfSliders
        baseSystemCost={FIXED_INSTALL_OVERHEAD + effectiveResults.systemSizeKw * 1000 * SYSTEM_COST_PER_WATT}
        baseAnnualProduction={effectiveResults.estimatedAnnualProduction}
        baseUtilityRate={BASE_ELECTRICITY_RATE}
      /> */}

      {/* Download PDF Report */}
      <button
        id="download-report"
        onClick={handleDownloadPDF}
        disabled={isDownloadingPDF || !leadData}
        className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isDownloadingPDF ? "Generating PDF..." : "📄 Download PDF Report"}
      </button>
    </div>
  );
}
