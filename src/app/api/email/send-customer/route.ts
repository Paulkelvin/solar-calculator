import { NextRequest, NextResponse } from 'next/server';
import { sendCustomerSubmissionEmail } from '@/lib/email/sender';
import type { Lead } from '../../../../../types/leads';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both old format and new Lead format
    const { 
      customerEmail, 
      customerName, 
      systemSize, 
      annualProduction, 
      address,
      to,
      lead,
      type
    } = body;

    // Handle new lead-based request
    if (lead && to) {
      const leadData = lead as Lead;
      
      console.log('[send-customer] Attempting to send email to:', to);
      console.log('[send-customer] FROM_EMAIL env:', process.env.EMAIL_FROM);
      console.log('[send-customer] FROM_NAME env:', process.env.EMAIL_FROM_NAME);
      console.log('[send-customer] RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
      
      const emailResult = await sendCustomerSubmissionEmail(
        to,
        leadData.contact.name,
        leadData.system_size_kw || 0,
        leadData.estimated_annual_production || 0,
        `${leadData.address.street}, ${leadData.address.city}, ${leadData.address.state} ${leadData.address.zip}`
      );

      if (!emailResult.success) {
        console.error('[send-customer] Email failed:', JSON.stringify(emailResult, null, 2));
        return NextResponse.json(
          { 
            error: 'Failed to send email', 
            details: emailResult,
            debugInfo: {
              hasApiKey: !!process.env.RESEND_API_KEY,
              fromEmail: process.env.EMAIL_FROM,
              fromName: process.env.EMAIL_FROM_NAME,
            }
          },
          { status: 500 }
        );
      }

      console.log('[send-customer] Email sent successfully:', emailResult.messageId);
      return NextResponse.json({ success: true, message: 'Email sent to ' + to });
    }

    // Handle old format (for backwards compatibility)
    if (!customerEmail || !customerName || !systemSize || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendCustomerSubmissionEmail(
      customerEmail,
      customerName,
      systemSize,
      annualProduction || 0,
      address
    );

    if (!result.success) {
      console.warn('Email send warning:', result);
      // Return 200 even if email failed (non-blocking)
      return NextResponse.json({ success: true, warning: 'Email service unavailable' });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Customer email API error:', error);
    // Don't fail the lead submission if email fails
    return NextResponse.json({
      success: true,
      warning: 'Email sending failed',
    });
  }
}
