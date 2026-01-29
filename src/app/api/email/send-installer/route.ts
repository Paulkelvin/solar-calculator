import { NextRequest, NextResponse } from 'next/server';
import { sendInstallerLeadEmail } from '@/lib/email/sender';

const INSTALLER_NAME = process.env.INSTALLER_NAME || 'Solar Team';

export async function POST(request: NextRequest) {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      systemSize,
      address,
      leadScore,
    } = await request.json();

    if (!customerName || !customerEmail || !systemSize || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendInstallerLeadEmail(
      INSTALLER_NAME,
      customerName,
      customerEmail,
      customerPhone || 'N/A',
      systemSize,
      address,
      Math.round(leadScore)
    );

    if (!result.success) {
      console.warn('Installer email send warning:', result);
      // Return 200 even if email failed (non-blocking)
      return NextResponse.json({ success: true, warning: 'Email service unavailable' });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Installer email API error:', error);
    // Don't fail the lead submission if email fails
    return NextResponse.json({
      success: true,
      warning: 'Email sending failed',
    });
  }
}
