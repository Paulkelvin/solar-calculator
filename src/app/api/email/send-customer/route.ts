import { NextRequest, NextResponse } from 'next/server';
import { sendCustomerSubmissionEmail } from '@/lib/email/sender';
import { generateProposalHTML, generatePDFBlob } from '@/lib/pdf-generator';
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

      // Derive system size and production if missing on the lead record
      const monthlyKwh = leadData.usage?.monthlyKwh
        ?? (leadData.usage?.billAmount ? leadData.usage.billAmount / 0.14 : undefined); // rough $0.14/kWh

      const estimatedAnnualProduction = leadData.estimated_annual_production
        ?? (monthlyKwh ? Math.round(monthlyKwh * 12) : 0);

      // Assume 1 kW ~ 1,300 kWh/year production as a conservative default
      const estimatedSystemSizeKw = leadData.system_size_kw
        ?? (estimatedAnnualProduction ? Math.round((estimatedAnnualProduction / 1300) * 100) / 100 : 0);
      
      // Build PDF attachment (summary)
      const leadForPdf = {
        name: leadData.contact?.name || 'Customer',
        email: leadData.contact?.email || '',
        phone: leadData.contact?.phone || '',
        address: {
          street: leadData.address?.street || '',
          city: leadData.address?.city || '',
          state: leadData.address?.state || '',
          zip: leadData.address?.zip || '',
        },
        usage: {
          monthlyBill: leadData.usage?.billAmount || 0,
          annualKwh: monthlyKwh ? Math.round(monthlyKwh * 12) : 0,
        },
        roof: {
          size: leadData.roof?.squareFeet || 0,
          sunExposure: leadData.roof?.sunExposure || 'good',
        },
        preferences: {
          battery: leadData.preferences?.wantsBattery ?? false,
          financing: leadData.preferences?.financingType || 'cash',
          timeline: leadData.preferences?.timeline || '3-months',
          notes: leadData.preferences?.notes || '',
        },
      };

      const calculationsForPdf = {
        systemSizeKw: estimatedSystemSizeKw,
        estimatedAnnualProduction: estimatedAnnualProduction,
        estimatedMonthlyProduction: Math.round(estimatedAnnualProduction / 12),
        financing: [],
        environmental: {
          annualCO2Offset: Math.round(estimatedAnnualProduction * 0.386),
          treesEquivalent: Math.round(estimatedAnnualProduction * 0.386 / 21),
          gridIndependence: 80,
        },
        confidence: 'preliminary' as const,
      };

      const pdfHtml = generateProposalHTML(leadForPdf, calculationsForPdf as any);
      const pdfBuffer = await generatePDFBlob(pdfHtml);

      const emailResult = await sendCustomerSubmissionEmail(
        to,
        leadData.contact.name,
        estimatedSystemSizeKw,
        estimatedAnnualProduction,
        `${leadData.address.street}, ${leadData.address.city}, ${leadData.address.state} ${leadData.address.zip}`,
        {
          pdfAttachment: {
            filename: 'solar-estimate.pdf',
            content: pdfBuffer,
          },
          shareToken: leadData.share_token,
          calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL,
        }
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
              derivedSystemSizeKw: estimatedSystemSizeKw,
              derivedAnnualProduction: estimatedAnnualProduction,
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
