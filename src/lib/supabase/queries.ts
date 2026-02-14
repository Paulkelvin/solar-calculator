import { supabase } from "./client";
import type { Lead } from "../../../types/leads";
import type { SolarCalculationResult } from "../../../types/calculations";

/**
 * Create a new lead from calculator submission.
 * Phase 2: Real Supabase integration enabled.
 * Phase 6.1: Added installer_id support for multi-tenant scoping
 * Phase 8: Added solar data storage
 * 
 * PHASE 1: Stubbed - returns mock data without database operations
 */
export async function createLead(
  leadData: Omit<Lead, "id" | "installer_id" | "lead_score" | "created_at" | "updated_at">,
  leadScore: number,
  installerId: string | null,
  solarData?: { solarPotentialKwhAnnual?: number; roofImageUrl?: string }
): Promise<Lead | null> {
  try {
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          installer_id: installerId,
          address: leadData.address,
          usage: leadData.usage,
          roof: leadData.roof,
          preferences: leadData.preferences,
          contact: leadData.contact,
          lead_score: leadScore,
          status: leadData.status || 'new'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Failed to create lead:", error);
      return null;
    }

    console.log("[SUPABASE] Lead created:", data.id);
    return data as unknown as Lead;
  } catch (err) {
    console.error("Error creating lead:", err);
    return null;
  }
}

/**
 * Log activity (form_submitted, results_viewed, etc.).
 * Phase 2: Real Supabase integration enabled.
 * Phase 6.1: Uses authenticated installer_id
 */
export async function logActivity(
  leadId: string,
  eventType: "form_submitted" | "results_viewed" | "pdf_generated",
  installerId: string | null,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const activity = {
      installer_id: installerId,
      lead_id: leadId,
      event_type: eventType,
      metadata: metadata || {}
    };

    const { error } = await supabase
      .from("activity_log")
      .insert([activity]);

    if (error) {
      console.error("Failed to log activity:", error);
      return false;
    }

    console.log("[SUPABASE] Logged activity:", eventType);
    return true;
  } catch (err) {
    console.error("Error logging activity:", err);
    return false;
  }
}

/**
 * Fetch all leads with pagination.
 * All admins see the same leads — no per-installer scoping.
 */
export async function fetchLeads(
  options?: { page?: number; pageSize?: number }
): Promise<{ data: Lead[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error, count } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching leads:", error);
      return { data: [], total: 0 };
    }

    console.log("[SUPABASE] Fetched leads:", data?.length || 0, "of", count);
    return {
      data: (data as unknown as Lead[]) || [],
      total: count ?? 0,
    };
  } catch (err) {
    console.error("Error fetching leads:", err);
    return { data: [], total: 0 };
  }
}

/**
 * Update an existing lead with new data.
 * Used when a partial lead (contact info) is completed with full calculation results.
 */
export async function updateLead(
  leadId: string,
  leadData: Partial<Omit<Lead, "id" | "created_at" | "updated_at">>,
  leadScore?: number
): Promise<Lead | null> {
  try {
    const updatePayload: any = {
      ...leadData,
      updated_at: new Date().toISOString()
    };

    if (leadScore !== undefined) {
      updatePayload.lead_score = leadScore;
    }

    const { data, error } = await supabase
      .from("leads")
      .update(updatePayload)
      .eq("id", leadId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update lead:", error);
      return null;
    }

    console.log("[SUPABASE] Lead updated:", data.id);
    return data as unknown as Lead;
  } catch (err) {
    console.error("Error updating lead:", err);
    return null;
  }
}

/**
 * Fetch a single lead by ID.
 * Phase 2: Real Supabase integration enabled.
 */
export async function fetchLead(id: string): Promise<Lead | null> {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching lead:", error);
      return null;
    }

    console.log("[SUPABASE] Fetched lead:", data?.id);
    return (data as unknown as Lead) || null;
  } catch (err) {
    console.error("Error fetching lead:", err);
    return null;
  }
}
