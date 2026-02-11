/**
 * Lead Persistence Service
 * Handles saving calculator submissions to Supabase with activity logging
 */

import { getSupabaseClient } from './client';
import type { CalculatorForm } from '../../../types/leads';
import type { SolarCalculationResult } from '../../../types/calculations';

const supabase = getSupabaseClient();

// For anonymous leads, use NULL instead of fake UUID
// Will be populated when user authenticates
const DEFAULT_INSTALLER_ID: string | null = null;

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

    // Prepare lead data - schema uses JSONB fields
    const leadData = {
      installer_id: DEFAULT_INSTALLER_ID,
      
      // Address as JSONB
      address: {
        street: formData.address?.street || '',
        city: formData.address?.city || '',
        state: formData.address?.state || 'CA',
        zip: formData.address?.zip || '',
        latitude: formData.address?.latitude || null,
        longitude: formData.address?.longitude || null,
      },
      
      // Usage as JSONB
      usage: {
        billAmount: formData.usage?.billAmount || null,
        monthlyKwh: formData.usage?.monthlyKwh || null,
      },
      
      // Roof as JSONB
      roof: {
        roofType: formData.roof?.roofType || 'asphalt',
        squareFeet: formData.roof?.squareFeet || null,
        sunExposure: formData.roof?.sunExposure || 'good',
      },
      
      // Preferences as JSONB
      preferences: {
        wantsBattery: formData.preferences?.wantsBattery || false,
        financingType: formData.preferences?.financingType || 'loan',
        creditScore: formData.preferences?.creditScore || 700,
        timeline: formData.preferences?.timeline || 'not_sure',
        notes: formData.preferences?.notes || null,
      },
      
      // Contact as JSONB
      contact: {
        name: formData.contact?.name || 'Anonymous',
        email: formData.contact?.email || null,
        phone: formData.contact?.phone || null,
      },
      
      // System data
      system_size_kw: results.systemSizeKw,
      estimated_annual_production: results.estimatedAnnualProduction,
      lead_score: solarScore || null,
      status: 'new',
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
        installer_id: DEFAULT_INSTALLER_ID,
        lead_id: leadId,
        event_type: activityType, // Schema uses event_type
        metadata: metadata || {},
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
