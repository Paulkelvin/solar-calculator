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

    // Derive system size and production if missing (prevent showing 0s)
    const monthlyKwh = lead.usage?.monthlyKwh
      ?? (lead.usage?.billAmount ? lead.usage.billAmount / 0.14 : undefined);
    
    const annualProduction = lead.estimated_annual_production
      || (lead.system_size_kw ? Math.round(lead.system_size_kw * 1300) : undefined)
      || (monthlyKwh ? Math.round(monthlyKwh * 12) : 0);
    
    const systemSizeKw = lead.system_size_kw
      || (annualProduction ? Math.round((annualProduction / 1300) * 100) / 100 : 0);

    // Return lead data (no sensitive installer info)
    return NextResponse.json({
      lead: {
        id: lead.id,
        address: lead.address,
        usage: lead.usage,
        roof: lead.roof,
        preferences: lead.preferences,
        contact: lead.contact,
        system_size_kw: systemSizeKw,
        estimated_annual_production: annualProduction,
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
