/**
 * Lead Persistence Service
 * Handles saving calculator submissions to Supabase with activity logging
 */

import { getSupabaseClient } from './client';
import type { CalculatorForm } from '../../../types/leads';
import type { SolarCalculationResult } from '../../../types/calculations';

const supabase = getSupabaseClient();

// Default installer ID for anonymous leads
const DEFAULT_INSTALLER_ID = '00000000-0000-0000-0000-000000000000';

export interface SaveLeadParams {
  formData: Partial<CalculatorForm>;
  results: SolarCalculationResult;
  solarScore?: number;
}

export interface SaveLeadResult {
  success: boolean;
  leadId?: string;
  error?: string;
}

/**
 * Save a lead to Supabase
 */
export async function saveLead(params: SaveLeadParams): Promise<SaveLeadResult> {
  try {
    const { formData, results, solarScore } = params;

    // Prepare lead data
    const leadData = {
      installer_id: DEFAULT_INSTALLER_ID,
      
      // Contact info
      name: formData.contact?.name || 'Anonymous',
      email: formData.contact?.email || null,
      phone: formData.contact?.phone || null,
      
      // Address
      address_street: formData.address?.street || '',
      address_city: formData.address?.city || '',
      address_state: formData.address?.state || 'CA',
      address_zip: formData.address?.zip || '',
      latitude: formData.address?.latitude || null,
      longitude: formData.address?.longitude || null,
      
      // Usage data
      monthly_bill: formData.usage?.billAmount || null,
      monthly_kwh: formData.usage?.monthlyKwh || null,
      annual_kwh: (formData.usage?.monthlyKwh || 0) * 12 || null,
      
      // Roof data
      roof_type: formData.roof?.roofType || 'asphalt',
      roof_square_feet: formData.roof?.squareFeet || null,
      roof_sun_exposure: formData.roof?.sunExposure || 'good',
      
      // Preferences
      battery_included: formData.preferences?.wantsBattery || false,
      financing_type: formData.preferences?.financingType || 'loan',
      installation_timeline: formData.preferences?.timeline || 'not_sure',
      notes: formData.preferences?.notes || null,
      
      // Solar score
      solar_score: solarScore || null,
      
      // Lead status
      status: 'new',
      lead_source: 'calculator',
      
      // Results data (stored as JSONB)
      estimated_system_size_kw: results.systemSizeKw,
      estimated_annual_production_kwh: results.estimatedAnnualProduction,
      estimated_monthly_production_kwh: results.estimatedMonthlyProduction,
      calculation_results: results, // Full results object
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError || !lead) {
      console.error('Lead insert error:', leadError);
      return {
        success: false,
        error: leadError?.message || 'Failed to save lead',
      };
    }

    const leadId = lead.id as string;

    // Log activity
    await logActivity(leadId, 'lead_created', {
      source: 'calculator',
      solar_score: solarScore,
      system_size: results.systemSizeKw,
    });

    return {
      success: true,
      leadId,
    };
  } catch (error) {
    console.error('Save lead error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log activity for a lead
 */
export async function logActivity(
  leadId: string,
  activityType: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('activity_log')
      .insert({
        lead_id: leadId,
        activity_type: activityType,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Activity log error:', error);
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  leadId: string,
  status: string
): Promise<SaveLeadResult> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    await logActivity(leadId, 'status_changed', { status });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get lead by ID (for dashboard)
 */
export async function getLead(leadId: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) {
      console.error('Get lead error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get lead:', error);
    return null;
  }
}

/**
 * Get leads for dashboard (with optional filtering)
 */
export async function getLeads(filters?: {
  status?: string;
  state?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.state) {
      query = query.eq('address_state', filters.state);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Get leads error:', error);
      return { leads: [], total: 0 };
    }

    return { leads: data || [], total: count || 0 };
  } catch (error) {
    console.error('Failed to get leads:', error);
    return { leads: [], total: 0 };
  }
}
