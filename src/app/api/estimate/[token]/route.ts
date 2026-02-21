import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

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

    // Return lead data (no sensitive installer info)
    return NextResponse.json({
      lead: {
        id: lead.id,
        address: lead.address,
        usage: lead.usage,
        roof: lead.roof,
        preferences: lead.preferences,
        contact: lead.contact,
        system_size_kw: lead.system_size_kw,
        estimated_annual_production: lead.estimated_annual_production,
        lead_score: lead.lead_score,
        share_token: lead.share_token,
        scheduled_appointment_at: lead.scheduled_appointment_at,
        created_at: lead.created_at,
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
