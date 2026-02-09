"use client";

import { useState, useEffect } from "react";
import type { SolarCalculationResult } from "../../../types/calculations";
import type { CalculatorForm } from "../../../types/leads";
import { fetchSolarData } from "@/lib/solar-service";
import type { SolarDataResponse } from "@/lib/solar-service";
import { generateSystemDesignOptions } from "@/lib/system-design-service";
import type { SystemDesignOption } from "@/lib/system-design-service";
import { SystemDesignComparison } from "./SystemDesignComparison";
import { RoofImageryViewer } from "./RoofImageryViewer";
import { CashFlowChart } from "./CashFlowChart";
import { BillOffsetChart, EnvironmentalImpactChart } from "./EnvironmentalCharts";
import { WhatIfSliders } from "./WhatIfSliders";
import { saveLead } from "@/lib/supabase/lead-service";
import { useCalculatorStore } from "@/store/calculatorStore";

interface ResultsViewProps {
  results: SolarCalculationResult;
  leadData?: Partial<CalculatorForm>;
}

export function ResultsView({ results, leadData }: ResultsViewProps) {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
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

  // Generate system design options when component mounts and data is available
  useEffect(() => {
    const generateDesignOptions = () => {
      // Calculate annual consumption from usage data
      const annualConsumptionKwh = (leadData?.usage?.monthlyKwh || 0) * 12;
      
      if (annualConsumptionKwh === 0) {
        console.log('No consumption data available for system design');
        return;
      }

      // Calculate sun factor from solar data (sunlight availability ratio)
      // Typical system produces annual kWh based on sun exposure
      let sunFactor = 1.2; // Default conservative estimate
      if (solarData) {
        // Sun factor approximation: annual production / (system size in kW * 365 days * 4 peak hours)
        // For now, use exposure percentage as proxy (85% = 1.2 factor, 75% = 1.0)
        sunFactor = 0.85 + (solarData.sunExposurePercentage / 100) * 0.4;
      }
      
      const state = leadData?.address?.state || 'CA';

      try {
        const options = generateSystemDesignOptions(annualConsumptionKwh, sunFactor, state);
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
  }, [leadData?.usage?.monthlyKwh, solarData?.sunExposurePercentage, leadData?.address?.state]);

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
              annualKwh: (leadData.usage?.monthlyKwh || 0) * 12
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
        <div className="mb-4 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
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
                {solarData 
                  ? (solarData.panelCapacityWatts / 1000).toFixed(1)
                  : results.systemSizeKw} kW
              </p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Annual Production</p>
              <p className="mt-1 text-2xl font-bold">
                {solarData
                  ? solarData.estimatedAnnualKwh.toLocaleString()
                  : results.estimatedAnnualProduction.toLocaleString()} kWh
              </p>
            </div>

            <div className="rounded-md bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Monthly Avg</p>
              <p className="mt-1 text-2xl font-bold">
                {solarData
                  ? solarData.estimatedMonthlyKwh.toLocaleString()
                  : results.estimatedMonthlyProduction.toLocaleString()} kWh
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
        solarPotentialKwhAnnual={
          solarData
            ? solarData.estimatedAnnualKwh
            : results.estimatedAnnualProduction
        }
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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Financing Options</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.financing.map((opt, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-background p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold capitalize text-lg">{opt.type}</h4>
                {opt.description && (
                  <span className="text-xs text-muted-foreground max-w-xs text-right">
                    {opt.description}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3 text-sm">
                {/* Down Payment */}
                {opt.type !== "lease" && opt.type !== "ppa" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upfront Cost:</span>
                    <span className="font-medium">
                      ${opt.downPayment.toLocaleString()}
                    </span>
                  </div>
                )}

                {(opt.type === "lease" || opt.type === "ppa") && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down Payment:</span>
                    <span className="font-medium text-green-600">$0</span>
                  </div>
                )}

                {/* Monthly Payment */}
                {opt.monthlyPayment > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Payment:</span>
                    <span className="font-medium">
                      ${opt.monthlyPayment.toLocaleString(undefined, {
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                )}

                {/* Total Interest (Loan only) */}
                {opt.totalInterest > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Interest:</span>
                    <span className="font-medium">
                      ${opt.totalInterest.toLocaleString(undefined, {
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                )}

                {/* Lease Term */}
                {opt.type === "lease" && opt.leaseTermYears && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term:</span>
                    <span className="font-medium">{opt.leaseTermYears} years</span>
                  </div>
                )}

                {/* PPA Rate */}
                {opt.type === "ppa" && opt.ppaRatePerKwh && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate/kWh:</span>
                      <span className="font-medium">
                        ${opt.ppaRatePerKwh.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Escalation:</span>
                      <span className="font-medium">
                        {opt.ppaEscalatorPercent?.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Break-Even:</span>
                    <span className="font-semibold">
                      {opt.payoffYears.toFixed(1)} years
                    </span>
                  </div>
                </div>

                <div className="flex justify-between rounded-md bg-primary/10 px-3 py-2">
                  <span className="text-muted-foreground">
                    {opt.type === "lease" ? "20-Year ROI:" : "25-Year ROI:"}
                  </span>
                  <span className="font-bold text-primary">
                    {opt.roi.toFixed(0)}%
                  </span>
                </div>

                {/* PPA 25-Year Savings */}
                {opt.type === "ppa" && opt.ppaSavings25Year && opt.ppaSavings25Year > 0 && (
                  <div className="flex justify-between rounded-md bg-green-50 px-3 py-2">
                    <span className="text-muted-foreground">25-Year Savings:</span>
                    <span className="font-bold text-green-700">
                      ${opt.ppaSavings25Year.toLocaleString(undefined, {
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
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
          <h3 className="font-semibold mb-4">System Design Options</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Compare different system sizes and find the best fit for your home and budget.
          </p>
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
              {results.environmental.annualCO2Offset.toLocaleString(undefined, {
                maximumFractionDigits: 0
              })}
            </p>
            <p className="text-xs text-muted-foreground">kg/year</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Trees Equivalent</p>
            <p className="mt-2 text-2xl font-bold">
              {results.environmental.treesEquivalent}
            </p>
            <p className="text-xs text-muted-foreground">trees/year</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Grid Independence</p>
            <p className="mt-2 text-2xl font-bold">
              {results.environmental.gridIndependence}%
            </p>
            <p className="text-xs text-muted-foreground">of consumption</p>
          </div>
        </div>
      </div>

      <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">Next Steps (Phase 2–3):</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>Detailed system design from satellite imagery</li>
          <li>Complete financing comparison (Cash, Loan, Lease/PPA)</li>
          <li>Incentive & tax credit calculations</li>
          <li>PDF proposal generation</li>
        </ul>
      </div>

      {/* 25-Year Cash Flow Projections */}
      <CashFlowChart
        systemCost={results.systemSizeKw * 3000} // ~$3/watt estimate
        annualSavings={results.estimatedAnnualProduction * 0.15} // $0.15/kWh estimate
        loanMonthlyPayment={results.financing.find(f => f.type === 'loan')?.monthlyPayment || 150}
        leaseMonthlyPayment={results.financing.find(f => f.type === 'lease')?.monthlyPayment || 120}
        ppaRate={results.financing.find(f => f.type === 'ppa')?.ppaRatePerKwh || 0.10}
        annualProduction={results.estimatedAnnualProduction}
        utilityRate={0.15}
        rateEscalation={3.5}
      />

      {/* Environmental Impact & Bill Offset Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BillOffsetChart
          offsetPercentage={
            ((results.estimatedAnnualProduction / ((leadData?.usage?.monthlyKwh || 1000) * 12)) * 100) || 85
          }
          annualConsumption={(leadData?.usage?.monthlyKwh || 1000) * 12}
          annualProduction={results.estimatedAnnualProduction}
        />

        <EnvironmentalImpactChart
          annualProduction={results.estimatedAnnualProduction}
          co2OffsetTons={(results.estimatedAnnualProduction * 0.0007) || 5.6} // 0.7kg CO₂/kWh
          treesEquivalent={Math.round((results.estimatedAnnualProduction * 0.0007 * 40) || 220)} // ~40 trees/ton CO₂
        />
      </div>

      {/* What-If Analysis Sliders */}
      <WhatIfSliders
        baseSystemCost={results.systemSizeKw * 3000}
        baseAnnualProduction={results.estimatedAnnualProduction}
        baseUtilityRate={0.15}
      />

      {/* Save Lead to Dashboard */}
      {!leadSaved && (
        <div className="rounded-lg border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6">
          <h3 className="text-lg font-semibold mb-2">💾 Save Your Results</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Save this solar estimate to your dashboard for future reference and track your progress.
          </p>
          <button
            onClick={async () => {
              setIsSavingLead(true);
              const result = await saveLead({
                formData: leadData || {},
                results,
                solarScore: solarScoreData.solarScore,
              });
              setIsSavingLead(false);
              if (result.success) {
                setLeadSaved(true);
              } else {
                alert(`Failed to save: ${result.error}`);
              }
            }}
            disabled={isSavingLead}
            className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSavingLead ? "Saving..." : "💾 Save to Dashboard"}
          </button>
        </div>
      )}

      {leadSaved && (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 p-6 text-center">
          <p className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
            ✅ Results Saved!
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Your solar estimate has been saved to the dashboard. You can view it anytime.
          </p>
        </div>
      )}

      <button
        onClick={handleDownloadPDF}
        disabled={isDownloadingPDF || !leadData}
        className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isDownloadingPDF ? "Generating PDF..." : "📄 Download PDF Report"}
      </button>
    </div>
  );
}
