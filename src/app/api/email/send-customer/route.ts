import { NextRequest, NextResponse } from 'next/server';
import { sendCustomerSubmissionEmail } from '@/lib/email/sender';

export async function POST(request: NextRequest) {
  try {
    const {
      customerEmail,
      customerName,
      systemSize,
      annualProduction,
      address,
    } = await request.json();

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
