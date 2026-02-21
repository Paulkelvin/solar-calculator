import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Lead } from '../../../../../types/leads';

/**
 * GET /api/estimate/[token]
 * Publicly accessible endpoint to fetch lead by share_token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch lead by share_token
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('share_token', token)
      .single();

    if (error || !lead) {
      console.error('Lead not found for token:', token, error);
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // Type assertion for Supabase data (double assertion for safety)
    const typedLead = lead as unknown as Lead;

    // Derive system size and production if missing (prevent showing 0s)
    const monthlyKwh = typedLead.usage?.monthlyKwh
      ?? (typedLead.usage?.billAmount ? typedLead.usage.billAmount / 0.14 : undefined);
    
    const annualProduction = typedLead.estimated_annual_production
      || (typedLead.system_size_kw ? Math.round(typedLead.system_size_kw * 1300) : undefined)
      || (monthlyKwh ? Math.round(monthlyKwh * 12) : 0);
    
    const systemSizeKw = typedLead.system_size_kw
      || (annualProduction ? Math.round((annualProduction / 1300) * 100) / 100 : 0);

    // Return lead data (no sensitive installer info)
    return NextResponse.json({
      lead: {
        id: typedLead.id,
        address: typedLead.address,
        usage: typedLead.usage,
        roof: typedLead.roof,
        preferences: typedLead.preferences,
        contact: typedLead.contact,
        system_size_kw: systemSizeKw,
        estimated_annual_production: annualProduction,
        lead_score: typedLead.lead_score,
        share_token: typedLead.share_token,
        scheduled_appointment_at: typedLead.scheduled_appointment_at,
        created_at: typedLead.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
