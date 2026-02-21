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
    
    console.log('Calendly webhook received:', JSON.stringify(payload, null, 2));

    // Calendly sends event type as "invitee.created" when someone books
    if (payload.event !== 'invitee.created') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Extract appointment data
    const invitee = payload.payload?.invitee;
    const event = payload.payload?.event;
    
    if (!invitee || !event) {
      console.error('Invalid webhook payload structure');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const scheduledTime = event.start_time; // ISO 8601 timestamp
    const inviteeEmail = invitee.email;
    const inviteeName = invitee.name;
    const questions = invitee.questions_and_answers || [];
    
    // Try to find lead by email
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: leads, error: findError } = await supabase
      .from('leads')
      .select('*')
      .eq('contact->email', inviteeEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Error finding lead:', findError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      // Lead not found - still acknowledge webhook but log warning
      console.warn(`No lead found for email: ${inviteeEmail}`);
      return NextResponse.json({ 
        received: true, 
        warning: 'No matching lead found' 
      }, { status: 200 });
    }

    const lead = leads[0];

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
      console.error('Error updating lead:', updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // Send installer notification email
    try {
      await sendInstallerAppointmentEmail({
        installerEmail: lead.installer_id, // For now, using installer_id as email placeholder
        leadData: {
          customerName: inviteeName,
          customerEmail: inviteeEmail,
          appointmentTime: scheduledTime,
          estimateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/estimate/${lead.share_token}`,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          leadId: lead.id,
        },
      });
      console.log('Installer notification sent');
    } catch (emailError) {
      // Don't fail the webhook if email fails
      console.error('Failed to send installer notification:', emailError);
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
