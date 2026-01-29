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
      const emailResult = await sendCustomerSubmissionEmail(
        to,
        leadData.contact.name,
        0, // systemSize placeholder
        0, // annualProduction placeholder
        `${leadData.address.street}, ${leadData.address.city}, ${leadData.address.state} ${leadData.address.zip}`
      );

      if (!emailResult.success) {
        return NextResponse.json(
          { error: 'Failed to send email', details: emailResult },
          { status: 500 }
        );
      }

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
