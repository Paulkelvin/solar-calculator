import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/sender';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * API route to send welcome email to newly confirmed admin/installer
 * Called after email confirmation in auth callback
 * 
 * Expects: { email: string } in request body
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if user already received welcome email
    // (to prevent duplicate emails on multiple logins)
    const { data: installer } = await supabase
      .from('installers')
      .select('welcome_email_sent, id')
      .eq('email', email)
      .single();

    if (!installer) {
      console.warn('Installer not found for email:', email);
      return NextResponse.json({
        success: false,
        error: 'Installer not found',
      }, { status: 404 });
    }

    if (installer.welcome_email_sent) {
      console.log('Welcome email already sent to:', email);
      return NextResponse.json({
        success: true,
        message: 'Welcome email already sent',
      });
    }

    // Send welcome email
    const result = await sendWelcomeEmail(email);

    if (result.success) {
      // Mark welcome email as sent in database
      await supabase
        .from('installers')
        .update({ welcome_email_sent: true })
        .eq('id', installer.id);

      console.log('Welcome email sent successfully to:', email);
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: result.messageId,
      });
    }

    console.warn('Failed to send welcome email:', result);
    return NextResponse.json(
      { error: 'Failed to send welcome email', details: result },
      { status: 500 }
    );
  } catch (error) {
    console.error('Welcome email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
