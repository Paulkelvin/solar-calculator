"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StepIndicator, type Step } from "./StepIndicator";
import { AddressStep } from "./steps/AddressStep";
import { UsageStep } from "./steps/UsageStep";
import { RoofStep } from "./steps/RoofStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { ContactStep } from "./steps/ContactStep";
import { performSolarCalculation, calculateLeadScore } from "@/lib/calculations/solar";
import { calculateIncentives } from "@/lib/incentives-service";
import { calculateEnhancedLeadScore } from "@/lib/enhanced-lead-scoring";
import type { LeadScoringFactors } from "@/lib/enhanced-lead-scoring";
import { createLead, logActivity } from "@/lib/supabase/queries";
import { useAuth } from "@/contexts/auth";
import type { CalculatorForm, Address, Usage, Roof, Preferences, Contact } from "../../../types/leads";
import type { SolarCalculationResult } from "../../../types/calculations";

const STEPS: Step[] = [
  { id: "address", label: "Address", order: 0 },
  { id: "usage", label: "Usage", order: 1 },
  { id: "roof", label: "Roof", order: 2 },
  { id: "preferences", label: "Preferences", order: 3 },
  { id: "contact", label: "Contact", order: 4 }
];

interface CalculatorWizardProps {
  onResults: (results: SolarCalculationResult, leadData: Partial<CalculatorForm>) => void;
}

export function CalculatorWizard({ onResults }: CalculatorWizardProps) {
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CalculatorForm>>({});

  const handleAddressChange = (address: Address) => {
    setFormData((prev) => ({ ...prev, address }));
    setError(null);
  };

  const handleUsageChange = (usage: Usage) => {
    setFormData((prev) => ({ ...prev, usage }));
    setError(null);
  };

  const handleRoofChange = (roof: Roof) => {
    setFormData((prev) => ({ ...prev, roof }));
    setError(null);
  };

  const handlePreferencesChange = (preferences: Preferences) => {
    setFormData((prev) => ({ ...prev, preferences }));
    setError(null);
  };

  const handleContactChange = (contact: Contact) => {
    setFormData((prev) => ({ ...prev, contact }));
    setError(null);
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step: submit
      await handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (
        !formData.address ||
        !formData.usage ||
        !formData.roof ||
        !formData.preferences ||
        !formData.contact
      ) {
        setError("All fields required");
        setIsLoading(false);
        return;
      }

      // Perform calculation
      const results = performSolarCalculation({
        monthlyKwh: formData.usage.monthlyKwh,
        billAmount: formData.usage.billAmount,
        roofSquareFeet: formData.roof.squareFeet,
        sunExposure: formData.roof.sunExposure,
        state: formData.address.state,
        wantsBattery: formData.preferences.wantsBattery
      });

      // Calculate incentives based on state and system size
      const incentiveBreakdown = calculateIncentives(
        formData.address.state || 'CO',
        results.systemSizeKw,
        results.estimatedAnnualProduction,
        0.14 // default $/kWh average
      );

      // Add incentive data to results
      results.incentives = {
        state: incentiveBreakdown.state,
        totalFirstYearIncentives: incentiveBreakdown.stateRebates.reduce((sum, i) => {
          if (i.type === 'rebate' && i.amount < 1) {
            return sum + (results.systemSizeKw * 1000 * i.amount);
          } else if (i.type === 'rebate') {
            return sum + i.amount;
          }
          return sum;
        }, 0),
        annualIncentives: incentiveBreakdown.totalAnnualIncentives,
        netMeteringAnnualValue: incentiveBreakdown.netMeteringValue,
        availableIncentives: [
          ...incentiveBreakdown.stateRebates.map(i => i.name),
          ...incentiveBreakdown.utilityRebates.map(i => i.name)
        ],
        disclaimer: incentiveBreakdown.disclaimer
      };

      // Calculate enhanced lead score with real solar data
      const scoringFactors: LeadScoringFactors = {
        solarPotential: (results.confidence === 'validated' || results.confidence === 'preliminary') ? 'high' : 'medium',
        sunExposure: 85, // Will be from real solar data in Phase 5.3
        roofAreaSqft: formData.roof?.squareFeet || 2500,
        systemSizeKw: results.systemSizeKw,
        annualSavings: results.incentives?.netMeteringAnnualValue || 1000,
        paybackYears: 7, // From financing calcs
        firstYearIncentives: results.incentives?.totalFirstYearIncentives || 0,
        roi25Year: results.financing[0]?.roi || 100,
        financingType: (formData.preferences?.financingType as any) || 'cash',
        timeline: (formData.preferences?.timeline as any) || 'flexible',
        hasCoordinates: !!formData.address?.latitude && !!formData.address?.longitude,
        hasContact: !!formData.contact?.email,
        completedAllSteps: true
      };

      const enhancedLeadScore = calculateEnhancedLeadScore(scoringFactors);
      
      // Keep old score for backwards compatibility
      const legacyLeadScore = calculateLeadScore(
        results.systemSizeKw,
        formData.preferences.financingType,
        formData.preferences.timeline
      );

      // Use enhanced score (Phase 5.3+)
      const leadScore = enhancedLeadScore;

      // Create lead in database (with new score and installer_id from auth context)
      if (!session.user?.id) {
        throw new Error('User not authenticated');
      }

      const lead = await createLead(
        {
          address: formData.address,
          usage: formData.usage,
          roof: formData.roof,
          preferences: formData.preferences,
          contact: formData.contact,
          status: 'new'
        },
        leadScore,
        session.user.id
      );

      // Log activity
      if (lead) {
        await logActivity(
          lead.id,
          "form_submitted",
          session.user.id,
          {
            systemSize: results.systemSizeKw,
            financingType: formData.preferences.financingType,
            enhancedScore: enhancedLeadScore,
            legacyScore: legacyLeadScore
          }
        );

        // Send emails asynchronously (don't wait for completion)
        sendLeadEmails(formData, results, leadScore).catch((err) =>
          console.error('Email sending failed:', err)
        );
      }

      // Return results to parent
      onResults(results, formData as CalculatorForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const sendLeadEmails = async (formData: Partial<CalculatorForm>, results: SolarCalculationResult, leadScore: number) => {
    if (!formData.contact || !formData.address) return;

    try {
      // Send customer email
      const customerResponse = await fetch('/api/email/send-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: formData.contact.email,
          customerName: formData.contact.name,
          systemSize: results.systemSizeKw,
          annualProduction: results.estimatedAnnualProduction,
          address: `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zip}`,
        }),
      });

      if (!customerResponse.ok) {
        console.warn('Failed to send customer email');
      }

      // Send installer email
      const installerResponse = await fetch('/api/email/send-installer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.contact.name,
          customerEmail: formData.contact.email,
          customerPhone: formData.contact.phone,
          systemSize: results.systemSizeKw,
          address: `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zip}`,
          leadScore,
        }),
      });

      if (!installerResponse.ok) {
        console.warn('Failed to send installer email');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
    }
  };

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "address":
        return (
          <AddressStep
            value={formData.address}
            onChange={handleAddressChange}
          />
        );
      case "usage":
        return (
          <UsageStep value={formData.usage} onChange={handleUsageChange} />
        );
      case "roof":
        return (
          <RoofStep value={formData.roof} onChange={handleRoofChange} />
        );
      case "preferences":
        return (
          <PreferencesStep
            value={formData.preferences}
            onChange={handlePreferencesChange}
          />
        );
      case "contact":
        return (
          <ContactStep
            value={formData.contact}
            onChange={handleContactChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-8">
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <h2 className="mb-6 text-2xl font-semibold">{STEPS[currentStep].label}</h2>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 min-h-96">{renderStep()}</div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 0 || isLoading}
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading
            ? "Computing..."
            : currentStep === STEPS.length - 1
              ? "Get Results"
              : "Next"}
        </Button>
      </div>
    </div>
  );
}
