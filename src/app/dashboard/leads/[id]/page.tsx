"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import type { Lead } from "@/../types/leads";

export default function LeadDetailPage() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      if (!session.user?.id || !leadId) return;

      try {
        const { data, error: err } = await supabase
          .from("leads")
          .select("*")
          .eq("id", leadId)
          .maybeSingle();

        if (err) throw err;
        if (!data) {
          setError("Lead not found");
          return;
        }

        setLead(data as unknown as Lead);
      } catch (err) {
        console.error("Failed to fetch lead:", err);
        setError(err instanceof Error ? err.message : "Failed to load lead");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLead();
  }, [session.user?.id, leadId]);

  const handleGeneratePDF = async () => {
    if (!lead) return;

    setIsGeneratingPDF(true);
    try {
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quote-${(lead.contact?.name || 'lead').replace(/[^a-zA-Z0-9-_ ]/g, '')}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    if (!lead) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/email/send-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: lead.contact?.email,
          lead: lead,
          type: "quote",
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      setError(null);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 5000);
    } catch (err) {
      console.error("Failed to send email:", err);
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 w-20 bg-muted rounded ml-auto" />
            <div className="h-10 w-24 bg-muted rounded ml-auto" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-muted rounded-md" />
          <div className="h-10 w-36 bg-muted rounded-md" />
          <div className="h-10 w-40 bg-muted rounded-md" />
        </div>

        {/* Card skeletons */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border p-6 space-y-4">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-5 w-32 bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-5 w-40 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error || "Lead not found"}</p>
        <button
          onClick={() => router.back()}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{lead.contact?.name || 'Unknown'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lead ID: {lead.id.substring(0, 8)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Lead Score</p>
          <p className="text-4xl font-bold text-primary">{lead.lead_score ?? 0}/100</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {emailSuccess && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          ✓ Email sent to {lead.contact?.email || 'customer'}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 active:scale-[0.97] transition-all duration-200 shadow-sm"
        >
          ← Back
        </button>
        <button
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-[0.97] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          {isGeneratingPDF ? "Generating..." : "📄 Generate PDF"}
        </button>
        <button
          onClick={handleSendEmail}
          disabled={isSendingEmail}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 active:scale-[0.97] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          {isSendingEmail ? "Sending..." : "✉️ Send to Customer"}
        </button>
      </div>

      {/* Contact Information */}
      <div className="rounded-xl border border-gray-200 p-6 space-y-4 hover:shadow-sm transition-shadow duration-200">
        <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{lead.contact?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium break-all">{lead.contact?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{lead.contact?.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{lead.status}</p>
          </div>
        </div>
      </div>

      {/* Property Address */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Property Address</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Street</p>
            <p className="font-medium">{lead.address?.street || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">City</p>
            <p className="font-medium">{lead.address?.city || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">State, ZIP</p>
            <p className="font-medium">{lead.address?.state || ''} {lead.address?.zip || ''}</p>
          </div>
          {lead.address?.latitude && lead.address?.longitude && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Coordinates</p>
              <p className="font-medium">{lead.address.latitude.toFixed(4)}, {lead.address.longitude.toFixed(4)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Information */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Energy Usage</h2>
        <div className="grid grid-cols-2 gap-4">
          {lead.usage?.billAmount != null && (
            <div>
              <p className="text-xs text-muted-foreground">Monthly Bill</p>
              <p className="font-medium">${(lead.usage.billAmount ?? 0).toFixed(2)}</p>
            </div>
          )}
          {lead.usage?.monthlyKwh != null && (
            <div>
              <p className="text-xs text-muted-foreground">Monthly kWh</p>
              <p className="font-medium">{(lead.usage.monthlyKwh ?? 0).toLocaleString()} kWh</p>
            </div>
          )}
        </div>
      </div>

      {/* Roof Information */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Roof Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-medium capitalize">{lead.roof?.roofType || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Square Feet</p>
            <p className="font-medium">{(lead.roof?.squareFeet ?? 0).toLocaleString()} sq ft</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sun Exposure</p>
            <p className="font-medium capitalize">{lead.roof?.sunExposure || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Interested in Battery</p>
            <p className="font-medium">{lead.preferences?.wantsBattery ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Financing Type</p>
            <p className="font-medium capitalize">{lead.preferences?.financingType || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Credit Score</p>
            <p className="font-medium">{lead.preferences?.creditScore || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Timeline</p>
            <p className="font-medium capitalize">{lead.preferences?.timeline || 'N/A'}</p>
          </div>
          {lead.preferences?.notes && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="font-medium text-sm">{lead.preferences.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Submission Date */}
      <div className="text-xs text-muted-foreground text-center">
        Submitted on {new Date(lead.created_at).toLocaleString()}
      </div>
    </div>
  );
}
