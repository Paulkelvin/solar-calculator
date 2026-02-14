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
import { performSolarCalculation, calculateLeadScore, BASE_ELECTRICITY_RATE } from "@/lib/calculations/solar";
import type { GoogleSolarOverride } from "@/lib/calculations/solar";
import { calculateIncentives } from "@/lib/incentives-service";
import { calculateEnhancedLeadScore } from "@/lib/enhanced-lead-scoring";
import type { LeadScoringFactors } from "@/lib/enhanced-lead-scoring";
import { fetchSolarData, type SolarDataResponse } from "@/lib/solar-service";
import { createLead, updateLead } from "@/lib/supabase/queries";
import { useAuth } from "@/contexts/auth";
import { useCalculatorStore } from "../../store/calculatorStore";
import type { CalculatorForm, Address, Usage, Roof, Preferences, Contact } from "../../../types/leads";
import type { SolarCalculationResult } from "../../../types/calculations";
import { AlertTriangle, Loader2 } from "lucide-react";

// Default installer ID for Phase 1 internal use
// Use null for anonymous leads (no auth required)
const DEFAULT_INSTALLER_ID: string | null = null;
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
    <div className="flex flex-col gap-3 rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-sm">
      <div className="flex items-center gap-3 text-sm">
        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        <div>
          <p className="font-semibold text-gray-900">Building a financing preview…</p>
          <p className="text-xs text-gray-600">Comparing cash vs. loan paths, incentives, and payoff timelines.</p>
        </div>
      </div>
      <p className="text-xs text-amber-700">
        This takes just a moment while we balance production, rates, and roof data from the previous step.
      </p>
    </div>
  );
}

const STEPS_WITH_TITLES = new Set<string>();

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
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);

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
  const safeStepIndex = Math.min(currentStep, STEPS.length - 1);
  const safeStep = STEPS[safeStepIndex];
  const safeStepId = safeStep.id;

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
    const stepId = safeStepId;
    if (!contentRef.current) return;
    if (!["usage", "financial", "preferences", "contact"].includes(stepId)) {
      return;
    }
    const node = contentRef.current;
    window.requestAnimationFrame(() => {
      node.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [currentStep, safeStepId]);

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
      safeStepId === "financial" &&
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
    if (safeStepId !== "financial" && financialPreviewLoading) {
      setFinancialPreviewLoading(false);
      if (financialLoadingTimerRef.current) {
        clearTimeout(financialLoadingTimerRef.current);
        financialLoadingTimerRef.current = null;
      }
    }
  }, [currentStep, financialPreviewLoading, safeStepId]);

  const validateCurrentStep = () => {
    let message: string | null = null;
    const stepId = safeStepId;

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
      if (!contact || !contact.name?.trim() || !contact.email?.trim() || !contact.phone?.trim()) {
        message = "Please provide your name, email, and phone number so we can send the proposal.";
      } else {
        // Validate phone has at least 10 digits
        const digits = contact.phone.replace(/\D/g, "");
        if (digits.length < 10) {
          message = "Phone number must be at least 10 digits. Please enter a valid phone number.";
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.email)) {
          message = "Please enter a valid email address.";
        }
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

    // Don't save again if we already have a saved lead
    if (savedLeadId) {
      return;
    }

    try {
      const installerId = null; // All leads are shared across admins
      
      // Calculate preliminary score
      const preliminaryScore = calculateLeadScore(
        5, // placeholder system size
        formData.preferences?.financingType || 'cash',
        formData.preferences?.timeline || '6-months'
      );

      const lead = await createLead(
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

      if (lead?.id) {
        setSavedLeadId(lead.id);
      }
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

      // Build Google Solar override from store data (single source of truth)
      let googleSolar: GoogleSolarOverride | undefined;
      if (
        roofInsights?.panelCapacityWatts &&
        roofInsights.panelCapacityWatts > 0 &&
        roofInsights?.annualProduction &&
        roofInsights.annualProduction > 0 &&
        roofInsights?.googleSolarSource === 'real'
      ) {
        googleSolar = {
          systemSizeKw: roofInsights.panelCapacityWatts / 1000,
          annualProductionKwh: roofInsights.annualProduction,
        };
      }

      // Perform calculation — Google Solar overrides mock when available
      const results = performSolarCalculation({
        monthlyKwh: formData.usage.monthlyKwh,
        billAmount: formData.usage.billAmount,
        roofSquareFeet: formData.roof.squareFeet,
        sunExposure: formData.roof.sunExposure,
        state: formData.address.state,
        wantsBattery: formData.preferences.wantsBattery
      }, googleSolar);

      // Calculate incentives based on state and system size
      const incentiveBreakdown = calculateIncentives(
        formData.address.state || 'CO',
        results.systemSizeKw,
        results.estimatedAnnualProduction,
        BASE_ELECTRICITY_RATE // centralized constant
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
      const cashFinancing = results.financing.find(f => f.type === 'cash');
      const annualSavingsCalc = results.estimatedAnnualProduction * BASE_ELECTRICITY_RATE;
      const scoringFactors: LeadScoringFactors = {
        solarPotential: (results.confidence === 'validated' || results.confidence === 'preliminary') ? 'high' : 'medium',
        sunExposure: roofInsights?.sunExposurePercentage ?? 85,
        roofAreaSqft: formData.roof?.squareFeet || 2500,
        systemSizeKw: results.systemSizeKw,
        annualSavings: annualSavingsCalc,
        paybackYears: cashFinancing?.payoffYears ?? 10,
        firstYearIncentives: results.incentives?.totalFirstYearIncentives || 0,
        roi25Year: cashFinancing?.roi || 100,
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

      // Create lead in database
      const installerId = null; // All leads are shared across admins

      // Fetch solar data from Google Solar API (async, non-blocking)
      let apiSolarData: { solarPotentialKwhAnnual?: number; roofImageUrl?: string } | undefined;
      try {
        if (formData.address.latitude && formData.address.longitude) {
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
          }
        }
      } catch (err) {
        // Continue without solar data
      }

      let lead;
      
      if (savedLeadId) {
        // Update existing lead with full calculation results
        lead = await updateLead(
          savedLeadId,
          {
            address: formData.address,
            usage: formData.usage,
            roof: formData.roof,
            preferences: formData.preferences,
            contact: formData.contact,
            status: 'new'
          },
          leadScore
        );
      } else {
        // Create new lead (fallback if contact wasn't saved)
        lead = await createLead(
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
      }

      // Log activity
      if (lead) {
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
        sendLeadEmails(formData, results, leadScore).catch(() => {});
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
    const step = safeStep;

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
            <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-6 text-sm text-amber-900">
              <p className="font-semibold text-amber-900">Share your contact details to unlock projected savings.</p>
              <p className="mt-2 text-xs text-amber-700">Tap "Previous" and add your name, email, and phone so we can reserve the proposal slot.</p>
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
            <div className="relative rounded-3xl border border-amber-100 bg-amber-50/70 p-5 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-8 w-8 rounded-full bg-white text-amber-600 shadow flex items-center justify-center font-semibold">💡</div>
                <div className="space-y-2 text-sm text-amber-900">
                  <h3 className="text-base font-semibold text-amber-800">What you'll unlock next</h3>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Cash vs. loan comparison tailored to your roof + usage</li>
                    <li>Estimated monthly payment and savings timeline</li>
                    <li>Battery option guidance based on your sun exposure</li>
                  </ul>
                  {contactComplete && (
                    <div className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm">Great! Continue to see your financing options.</div>
                  )}
                </div>
              </div>
              <div className="relative mt-4 space-y-3 rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-sm overflow-hidden">
                <div className="relative flex items-center justify-between text-sm font-semibold text-amber-900">
                  <span>Financing preview</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Complete contact to unlock</span>
                </div>
                <div className="relative grid gap-3 text-sm text-amber-900 select-none" style={{ filter: 'blur(2px)' }}>
                  <div className="rounded-xl border border-amber-50 bg-amber-50/70 p-3 shadow-inner">
                    <div className="mb-2 flex items-center justify-between font-semibold">
                      <span>Cash path</span>
                      <span className="text-sm">~$18,500</span>
                    </div>
                    <div className="space-y-1 text-xs text-amber-800">
                      <div>• Pay upfront, own immediately</div>
                      <div>• Estimated ~$1,600/yr savings</div>
                      <div>• Payback in ~12 years</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-50 bg-amber-50/70 p-3 shadow-inner">
                    <div className="mb-2 flex items-center justify-between font-semibold">
                      <span>Loan path</span>
                      <span className="text-sm">$185/mo</span>
                    </div>
                    <div className="space-y-1 text-xs text-amber-800">
                      <div>• Finance over 10 years</div>
                      <div>• Immediate net-positive cash flow</div>
                      <div>• Own after loan term</div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none">
                  <div className="rounded-xl bg-white/80 px-4 py-2 shadow-lg backdrop-blur-sm">
                    <p className="text-xs font-semibold text-amber-800">🔒 Fill in your details to see numbers</p>
                  </div>
                </div>
              </div>
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
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 mb-3 sm:mb-6 flex-none">
        <StepIndicator steps={STEPS} currentStep={safeStepIndex} />
      </div>

      {/* Main Content */}
      <div
        ref={contentRef}
        className={`relative flex-1 overflow-y-auto px-4 pb-4 pt-4 ${
          safeStepId === "roof" ? "roof-scroll" : "no-scrollbar"
        }`}
      >
        {error && showErrorToast && (
          <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-2xl shadow-red-100 transition-all duration-300">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-red-500" />
              <div>
                <p className="font-semibold">We need a bit more info</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {STEPS_WITH_TITLES.has(safeStepId) && (
          <h2 className="mb-2 text-lg font-bold text-gray-900">
            {safeStep.label}
          </h2>
        )}

        <div className="mb-2 min-h-[320px] sm:min-h-[520px]">
          {isLoading && currentStep === STEPS.length - 1 ? (
            <div className="flex min-h-[320px] sm:min-h-[520px] flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <div className="space-y-2 text-center">
                <p className="text-lg font-semibold text-gray-900">Computing your solar savings...</p>
                <p className="text-sm text-gray-600">Analyzing roof data, calculating incentives, and building financing options</p>
              </div>
            </div>
          ) : (
            <div
              key={safeStepId}
              className="animate-in fade-in slide-in-from-right duration-500"
            >
              {renderStep()}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="bg-white border-t border-gray-200 p-3 flex-none">
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0 || isLoading}
            className="px-3 sm:px-5 py-2.5 text-sm h-11 bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200 font-medium disabled:opacity-50"
            style={{ backgroundColor: currentStep === 0 ? '#e5e7eb' : '#f3f4f6' }}
          >
            ← Previous
          </Button>

          {currentStep !== 0 && (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1 px-5 py-2.5 text-sm h-11 font-semibold shadow-lg"
              style={{ backgroundColor: '#d97706', color: 'white' }}
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
