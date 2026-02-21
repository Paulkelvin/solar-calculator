import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendInstallerAppointmentEmail } from '@/lib/email/sender';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Calendly Webhook Handler
 * Captures appointment bookings and:
 * 1. Updates lead with appointment details
 * 2. Changes lead status to "contacted"
 * 3. Sends installer notification
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    console.log('[webhook] Calendly webhook received:', JSON.stringify(payload, null, 2));

    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[webhook] Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase credentials'
      }, { status: 500 });
    }

    // Calendly sends event type as "invitee.created" when someone books
    if (payload.event !== 'invitee.created') {
      console.log('[webhook] Ignoring non-invitee event:', payload.event);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Extract appointment data
    const invitee = payload.payload?.invitee;
    const event = payload.payload?.event;
    
    if (!invitee || !event) {
      console.error('[webhook] Invalid webhook payload structure');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const scheduledTime = event.start_time; // ISO 8601 timestamp
    const inviteeEmail = invitee.email;
    const inviteeName = invitee.name;
    const questions = invitee.questions_and_answers || [];
    
    console.log('[webhook] Processing booking for:', inviteeEmail);
    
    // Try to find lead by email
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, try to get all leads and filter in memory (more reliable than JSONB query)
    const { data: allLeads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[webhook] Error fetching leads:', fetchError);
      return NextResponse.json({ 
        error: 'Database error',
        details: fetchError.message
      }, { status: 500 });
    }

    // Filter leads by email in memory
    const matchingLeads = (allLeads || []).filter((lead: any) => {
      const leadEmail = lead.contact?.email;
      return leadEmail && leadEmail.toLowerCase() === inviteeEmail.toLowerCase();
    });

    console.log('[webhook] Found matching leads:', matchingLeads.length);

    if (matchingLeads.length === 0) {
      // Lead not found - still acknowledge webhook but log warning
      console.warn(`[webhook] No lead found for email: ${inviteeEmail}`);
      return NextResponse.json({ 
        received: true, 
        warning: 'No matching lead found',
        searchedEmail: inviteeEmail
      }, { status: 200 });
    }

    const lead = matchingLeads[0];
    console.log('[webhook] Updating lead:', lead.id);

    // Format appointment notes
    const appointmentNotes = `
Scheduled via Calendly:
- Time: ${new Date(scheduledTime).toLocaleString('en-US', { 
  dateStyle: 'full', 
  timeStyle: 'short' 
})}
- Invitee: ${inviteeName}
${questions.length > 0 ? '\nQuestions:\n' + questions.map((q: any) => `- ${q.question}: ${q.answer}`).join('\n') : ''}
    `.trim();

    // Update lead with appointment details and status
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        scheduled_appointment_at: scheduledTime,
        appointment_notes: appointmentNotes,
        status: 'contacted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('[webhook] Error updating lead:', updateError);
      return NextResponse.json({ error: 'Update failed', details: updateError.message }, { status: 500 });
    }

    console.log('[webhook] ✅ Lead updated successfully');

    // Send installer notification email
    const installerEmail = process.env.INSTALLER_EMAIL;
    if (!installerEmail) {
      console.warn('[webhook] ⚠️ INSTALLER_EMAIL not set, skipping email notification');
    } else {
      try {
        console.log('[webhook] Sending installer notification to:', installerEmail);
        await sendInstallerAppointmentEmail({
          installerEmail,
          leadData: {
            customerName: inviteeName,
            customerEmail: inviteeEmail,
            appointmentTime: scheduledTime,
            estimateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/estimate/${lead.share_token}`,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            leadId: lead.id,
          },
        });
        console.log('[webhook] ✅ Installer notification sent successfully');
      } catch (emailError) {
        // Don't fail the webhook if email fails
        console.error('[webhook] ❌ Failed to send installer notification:', emailError);
      }
    }

    return NextResponse.json({ 
      received: true,
      leadId: lead.id,
      statusUpdated: true,
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
