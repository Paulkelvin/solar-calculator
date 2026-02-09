"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StepIndicator, type Step } from "./StepIndicator";
import { AddressStep } from "./steps/AddressStep";
import { UsageStep } from "./steps/UsageStep";
import { RoofStep } from "./steps/RoofStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { ContactStep } from "./steps/ContactStep";
import { FinancialPreviewStep } from "./steps/FinancialPreviewStep";
import { performSolarCalculation, calculateLeadScore } from "@/lib/calculations/solar";
import { calculateIncentives } from "@/lib/incentives-service";
import { calculateEnhancedLeadScore } from "@/lib/enhanced-lead-scoring";
import type { LeadScoringFactors } from "@/lib/enhanced-lead-scoring";
import { fetchSolarData, type SolarDataResponse } from "@/lib/solar-service";
import { createLead } from "@/lib/supabase/queries";
import { useAuth } from "@/contexts/auth";
import { useCalculatorStore } from "../../store/calculatorStore";
import type { CalculatorForm, Address, Usage, Roof, Preferences, Contact } from "../../../types/leads";
import type { SolarCalculationResult } from "../../../types/calculations";
import { AlertTriangle, Loader2 } from "lucide-react";

// Default installer ID for Phase 1 internal use
const DEFAULT_INSTALLER_ID = '00000000-0000-0000-0000-000000000000';
const FINANCIAL_PREVIEW_DELAY_MS = 1400;

const STEPS: Step[] = [
  { id: "address", label: "Address", order: 0 },
  { id: "roof", label: "Roof", order: 1 },
  { id: "usage", label: "Usage", order: 2 },
  { id: "contact", label: "Contact", order: 3 },
  { id: "financial", label: "Financial", order: 4 },
  { id: "preferences", label: "Preferences", order: 5 }
];

function FinancialPreviewLoading() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-white/95 p-6 shadow-sm">
      <div className="flex items-center gap-3 text-sm">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        <div>
          <p className="font-semibold text-gray-900">Building a financing preview…</p>
          <p className="text-xs text-gray-600">Comparing cash vs. loan paths, incentives, and payoff timelines.</p>
        </div>
      </div>
      <p className="text-xs text-emerald-700">
        This takes just a moment while we balance production, rates, and roof data from the previous step.
      </p>
    </div>
  );
}

const STEPS_WITH_TITLES = new Set(["contact", "preferences"]);

interface CalculatorWizardProps {
  onResults: (results: SolarCalculationResult, leadData: Partial<CalculatorForm>) => void;
}

const isAddressComplete = (address?: Address | null) => {
  if (!address) return false;
  return Boolean(
    address.street &&
    address.city &&
    address.state &&
    address.zip &&
    typeof address.latitude === "number" &&
    typeof address.longitude === "number"
  );
};

const isContactComplete = (contact?: Contact | null) => {
  if (!contact) return false;
  return Boolean(contact.name?.trim() && contact.email?.trim() && contact.phone?.trim());
};

export function CalculatorWizard({ onResults }: CalculatorWizardProps) {
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [financialPreviewLoading, setFinancialPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CalculatorForm>>({});
  const [auxSolarData, setAuxSolarData] = useState<SolarDataResponse | null>(null);
  const [solarLoading, setSolarLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [hasReceivedInitialAddress, setHasReceivedInitialAddress] = useState(false);
  const [addressConfirmedByUser, setAddressConfirmedByUser] = useState(false);
  const autoAdvanceKeyRef = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousStepRef = useRef(0);
  const financialLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contactComplete = isContactComplete(formData.contact);

  const handleAddressChange = (address: Address, meta?: { userInitiated?: boolean }) => {
    setFormData((prev) => ({ ...prev, address }));
    setError(null);
    setAuxSolarData(null);
    const wasInitialized = hasReceivedInitialAddress;
    if (!wasInitialized) {
      setHasReceivedInitialAddress(true);
    }
    if (meta?.userInitiated && isAddressComplete(address)) {
      setAddressConfirmedByUser(true);
    } else if (meta && meta.userInitiated === false) {
      setAddressConfirmedByUser(false);
    } else if (wasInitialized && isAddressComplete(address)) {
      setAddressConfirmedByUser(true);
    }
  };

  const handleUsageChange = (usage: Usage) => {
    setFormData((prev) => ({ ...prev, usage }));
    setError(null);
  };

  const handleRoofChange = (roof: Roof) => {
    setFormData((prev) => ({ ...prev, roof }));
    setError(null);
  };

  const handleAddressCoordinatesChange = useCallback(({ latitude, longitude }: { latitude: number; longitude: number }) => {
    setFormData((prev) => {
      if (!prev.address) return prev;
      return {
        ...prev,
        address: {
          ...prev.address,
          latitude,
          longitude,
        },
      };
    });
  }, []);

  const handlePreferencesChange = (preferences: Preferences) => {
    setFormData((prev) => ({ ...prev, preferences }));
    setError(null);
  };

  const handleContactChange = (contact: Contact) => {
    setFormData((prev) => ({ ...prev, contact }));
    setError(null);
  };

  const { setShowSolarScore, showSolarScore, solarData: roofInsights } = useCalculatorStore();

  const fetchRoofDataIfNeeded = useCallback(async () => {
    const latitude = formData.address?.latitude;
    const longitude = formData.address?.longitude;
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      auxSolarData ||
      solarLoading
    ) {
      return;
    }

    setSolarLoading(true);
    try {
      const data = await fetchSolarData(latitude, longitude);
      setAuxSolarData(data);
    } catch (error) {
      console.warn('Failed to fetch solar data for roof auto-population:', error);
    } finally {
      setSolarLoading(false);
    }
  }, [formData.address?.latitude, formData.address?.longitude, auxSolarData, solarLoading]);

  const advanceFromAddress = useCallback(async () => {
    await fetchRoofDataIfNeeded();
    if (!showSolarScore) {
      setShowSolarScore(true);
    }
    setAddressConfirmedByUser(false);
    setCurrentStep(1);
  }, [fetchRoofDataIfNeeded, setShowSolarScore, showSolarScore]);

  const requestAddressEdit = useCallback(() => {
    autoAdvanceKeyRef.current = null;
    setAddressConfirmedByUser(false);
    setError(null);
    setShowSolarScore(false);
    setCurrentStep(0);
  }, [setShowSolarScore]);

  useEffect(() => {
    if (error) {
      setShowErrorToast(true);
      const timer = window.setTimeout(() => setShowErrorToast(false), 4000);
      return () => window.clearTimeout(timer);
    }
    setShowErrorToast(false);
  }, [error]);

  useEffect(() => {
    const stepId = STEPS[currentStep].id;
    if (!contentRef.current) return;
    if (!["usage", "financial", "preferences", "contact"].includes(stepId)) {
      return;
    }
    const node = contentRef.current;
    window.requestAnimationFrame(() => {
      node.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 0) {
      autoAdvanceKeyRef.current = null;
      return;
    }

    if (!addressConfirmedByUser) {
      return;
    }

    const address = formData.address;
    if (!isAddressComplete(address)) {
      return;
    }

    const key = `${address.street}|${address.city}|${address.state}|${address.zip}|${address.latitude}|${address.longitude}`;
    if (autoAdvanceKeyRef.current === key) {
      return;
    }

    autoAdvanceKeyRef.current = key;
    void advanceFromAddress();
  }, [currentStep, addressConfirmedByUser, formData.address, advanceFromAddress]);

  useEffect(() => {
    const previousIndex = previousStepRef.current;
    previousStepRef.current = currentStep;
    const movedFromContact =
      STEPS[currentStep].id === "financial" &&
      STEPS[previousIndex]?.id === "contact";

    if (!movedFromContact) {
      return;
    }

    if (financialLoadingTimerRef.current) {
      clearTimeout(financialLoadingTimerRef.current);
    }

    setFinancialPreviewLoading(true);
    financialLoadingTimerRef.current = setTimeout(() => {
      setFinancialPreviewLoading(false);
      financialLoadingTimerRef.current = null;
    }, FINANCIAL_PREVIEW_DELAY_MS);

    return () => {
      if (financialLoadingTimerRef.current) {
        clearTimeout(financialLoadingTimerRef.current);
        financialLoadingTimerRef.current = null;
      }
    };
  }, [currentStep]);

  useEffect(() => {
    if (STEPS[currentStep].id !== "financial" && financialPreviewLoading) {
      setFinancialPreviewLoading(false);
      if (financialLoadingTimerRef.current) {
        clearTimeout(financialLoadingTimerRef.current);
        financialLoadingTimerRef.current = null;
      }
    }
  }, [currentStep, financialPreviewLoading]);

  const validateCurrentStep = () => {
    let message: string | null = null;
    const stepId = STEPS[currentStep].id;

    if (stepId === "address") {
      const address = formData.address;
      if (!address?.street) {
        message = "Enter your address to continue.";
      } else if (!address.city || !address.state || !address.zip) {
        message = "Please select a full address from the suggestions so we can verify city, state, and ZIP.";
      } else if (typeof address.latitude !== "number" || typeof address.longitude !== "number") {
        message = "Select an address from the dropdown so we can locate your roof.";
      }
    } else if (stepId === "roof") {
      const roof = formData.roof;
      if (!roof) {
        message = "Review the roof details before continuing.";
      } else if (!roof.squareFeet || roof.squareFeet <= 0) {
        message = "Enter your usable roof square footage to continue.";
      } else if (!roof.sunExposure) {
        message = "Select the sun exposure that best matches your roof.";
      } else if (!roof.roofType) {
        message = "Choose the roof material before moving on.";
      }
    } else if (stepId === "usage") {
      const usage = formData.usage;
      if (!usage || (!usage.billAmount && !usage.monthlyKwh)) {
        message = "Provide either your average monthly bill or your monthly kWh usage to continue.";
      }
    } else if (stepId === "financial") {
      // Preview only; no validation
    } else if (stepId === "preferences") {
      const preferences = formData.preferences;
      if (!preferences || !preferences.financingType || !preferences.timeline) {
        message = "Select your financing preference and installation timeline to continue.";
      }
    } else if (stepId === "contact") {
      const contact = formData.contact;
      if (!contact || !contact.name || !contact.email || !contact.phone) {
        message = "Please provide your name, email, and phone number so we can send the proposal.";
      }
    }

    if (message) {
      setError(message);
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep === 0) {
      await advanceFromAddress();
      return;
    }

    // Save contact data immediately when leaving contact step
    if (STEPS[currentStep].id === "contact" && formData.contact) {
      await saveContactLead();
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step: submit
      await handleSubmit();
    }
  };

  const saveContactLead = async () => {
    if (!formData.address || !formData.usage || !formData.roof || !formData.contact) {
      return;
    }

    try {
      const installerId = session?.user?.id || DEFAULT_INSTALLER_ID;
      
      // Calculate preliminary score
      const preliminaryScore = calculateLeadScore(
        5, // placeholder system size
        formData.preferences?.financingType || 'cash',
        formData.preferences?.timeline || '6-months'
      );

      await createLead(
        {
          address: formData.address,
          usage: formData.usage,
          roof: formData.roof,
          preferences: formData.preferences || { 
            financingType: 'cash', 
            timeline: '6-months', 
            wantsBattery: false,
            creditScore: 700
          },
          contact: formData.contact,
          status: 'contacted'
        },
        preliminaryScore,
        installerId
      );

      console.log('[PRODUCTION] Contact data saved to database');
    } catch (err) {
      console.error('Failed to save contact lead:', err);
      // Don't block user flow if save fails
    }
  };

  const handlePrev = () => {
    if (currentStep === 1) {
      requestAddressEdit();
      return;
    }

    if (currentStep > 1) {
      setError(null);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Checking form data:', formData);
      if (
        !formData.address ||
        !formData.usage ||
        !formData.roof ||
        !formData.preferences ||
        !formData.contact
      ) {
        console.log('Missing required fields');
        setError("All fields required");
        setIsLoading(false);
        return;
      }

      console.log('Form validation passed, performing calculation');
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
      console.log('Checking authentication, session:', session);
      const installerId = session.user?.id || DEFAULT_INSTALLER_ID;
      console.log('Using installer ID:', installerId);

      // Fetch solar data from Google Solar API (async, non-blocking)
      let apiSolarData: { solarPotentialKwhAnnual?: number; roofImageUrl?: string } | undefined;
      try {
        if (formData.address.latitude && formData.address.longitude) {
          console.log('Fetching solar data from API...');
          const solarResponse = await fetch('/api/google-solar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: formData.address.latitude,
              longitude: formData.address.longitude,
              stateCode: formData.address.state,
              address: `${formData.address.street}, ${formData.address.city}, ${formData.address.state}`
            })
          });
          if (solarResponse.ok) {
            apiSolarData = await solarResponse.json();
            console.log('Solar data fetched:', apiSolarData);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch solar data:', err);
        // Continue without solar data
      }

      console.log('Creating lead...');
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
        installerId,
        apiSolarData
      );
      console.log('Lead created:', lead);

      // Log activity
      if (lead) {
        console.log('Lead created successfully, calling onResults');
        // TODO: Implement activity logging
        // await logActivity(
        //   lead.id,
        //   "form_submitted",
        //   session.user.id,
        //   {
        //     systemSize: results.systemSizeKw,
        //     financingType: formData.preferences.financingType,
        //     enhancedScore: enhancedLeadScore,
        //     legacyScore: legacyLeadScore
        //   }
        // );

        // Send emails asynchronously (don't wait for completion)
        sendLeadEmails(formData, results, leadScore).catch((err) =>
          console.error('Email sending failed:', err)
        );
      }

      console.log('Calling onResults with results and formData');
      // Return results to parent
      onResults(results, formData as CalculatorForm);
    } catch (err) {
      console.error('handleSubmit error:', err);
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
      case "roof":
        return (
          <RoofStep 
            value={formData.roof} 
            onChange={handleRoofChange}
            address={formData.address}
            onEditAddress={requestAddressEdit}
            onAddressCoordinatesChange={handleAddressCoordinatesChange}
          />
        );
      case "usage":
        return (
          <UsageStep value={formData.usage} onChange={handleUsageChange} />
        );
      case "financial":
        if (!contactComplete) {
          return (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 text-sm text-emerald-900">
              <p className="font-semibold text-emerald-900">Share your contact details to unlock projected savings.</p>
              <p className="mt-2 text-xs text-emerald-700">Tap “Previous” and add your name, email, and phone so we can reserve the proposal slot.</p>
            </div>
          );
        }
        return financialPreviewLoading ? (
          <FinancialPreviewLoading />
        ) : (
          <FinancialPreviewStep
            address={formData.address}
            usage={formData.usage}
            roof={formData.roof}
            preferences={formData.preferences}
            solarSnapshot={roofInsights}
          />
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
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-3xl border border-gray-100 bg-white/95 p-5 shadow-sm">
              <ContactStep
                value={formData.contact}
                onChange={handleContactChange}
              />
            </div>
            <div className="relative">
              <div className={`transition-all duration-500 ${contactComplete ? "opacity-100" : "pointer-events-none blur-[2px] opacity-70"}`}>
                <FinancialPreviewStep
                  address={formData.address}
                  usage={formData.usage}
                  roof={formData.roof}
                  preferences={formData.preferences}
                  solarSnapshot={roofInsights}
                />
              </div>
              {contactComplete ? (
                <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-emerald-600/90 px-3 py-1 text-[11px] font-semibold text-white shadow">
                  Ready to unlock
                </div>
              ) : (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-300 bg-white/80 px-6 text-center">
                  <p className="text-sm font-semibold text-emerald-900">Finish your contact info to reveal the detailed plan.</p>
                  <p className="mt-2 text-xs text-emerald-700">We use it to send your PDF proposal and coordinate a design review.</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-full max-h-full overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 mb-6 flex-none">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Main Content */}
      <div
        ref={contentRef}
        className={`relative flex-1 overflow-y-auto px-4 pb-4 pt-4 ${
          STEPS[currentStep].id === "roof" ? "roof-scroll" : "no-scrollbar"
        }`}
      >
        {error && showErrorToast && (
          <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex justify-center">
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-2xl shadow-red-100">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-red-500" />
              <div>
                <p className="font-semibold">We need a bit more info</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {STEPS_WITH_TITLES.has(STEPS[currentStep].id) && (
          <h2 className="mb-2 text-lg font-bold text-gray-900">
            {STEPS[currentStep].label}
          </h2>
        )}

        <div className="mb-2 min-h-[520px]">
          <div
            key={STEPS[currentStep].id}
            className="animate-in fade-in slide-in-from-right duration-500"
          >
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="bg-white border-t border-gray-200 p-3 flex-none">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0 || isLoading}
            className="px-5 py-2.5 text-sm h-11 bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200 font-medium disabled:opacity-50"
            style={{ backgroundColor: currentStep === 0 ? '#e5e7eb' : '#f3f4f6' }}
          >
            ← Previous
          </Button>

          {currentStep !== 0 && (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1 px-5 py-2.5 text-sm h-11 font-semibold shadow-lg"
              style={{ backgroundColor: '#10b981', color: 'white' }}
            >
              {isLoading
                ? "Computing..."
                : currentStep === STEPS.length - 1
                  ? "Get Results →"
                  : "Next →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
