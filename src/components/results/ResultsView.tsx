"use client";

import { useState } from "react";
import type { SolarCalculationResult } from "../../../types/calculations";
import type { CalculatorForm } from "../../../types/leads";

interface ResultsViewProps {
  results: SolarCalculationResult;
  leadData?: Partial<CalculatorForm>;
}

export function ResultsView({ results, leadData }: ResultsViewProps) {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

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
      <div className="rounded-lg border border-border bg-background p-6">
        <div className="mb-4 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
          Mocked Results — Phase 1
        </div>

        <h2 className="text-2xl font-semibold">Your Solar ROI Estimate</h2>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-md bg-secondary p-4">
            <p className="text-xs text-muted-foreground">System Size</p>
            <p className="mt-1 text-2xl font-bold">{results.systemSizeKw} kW</p>
          </div>

          <div className="rounded-md bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Annual Production</p>
            <p className="mt-1 text-2xl font-bold">
              {results.estimatedAnnualProduction.toLocaleString()} kWh
            </p>
          </div>

          <div className="rounded-md bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Monthly Avg</p>
            <p className="mt-1 text-2xl font-bold">
              {results.estimatedMonthlyProduction.toLocaleString()} kWh
            </p>
          </div>
        </div>
      </div>

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
