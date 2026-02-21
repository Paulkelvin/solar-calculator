import { NextRequest, NextResponse } from 'next/server';
import { generateProposalHTML, generatePDFBlob } from '@/lib/pdf-generator';

export const runtime = 'nodejs';

/**
 * POST /api/pdf/generate
 * Generates a PDF report from calculation data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { leadData, calculations, lead } = body;

    // Handle new format from dashboard (lead object)
    if (lead) {
      // Transform lead into expected format
      // Normalize usage for PDF generator expectations
      const monthlyKwh = lead.usage?.monthlyKwh
        ?? (lead.usage?.billAmount ? lead.usage.billAmount / 0.14 : undefined);
      const annualKwh = monthlyKwh ? Math.round(monthlyKwh * 12) : 0;

      const transformedLeadData = {
        name: lead.contact?.name || 'Customer',
        email: lead.contact?.email || '',
        phone: lead.contact?.phone || '',
        address: lead.address,
        usage: {
          monthlyBill: lead.usage?.billAmount || undefined,
          annualKwh,
        },
        roof: {
          size: lead.roof?.squareFeet || 0,
          sunExposure: lead.roof?.sunExposure || 'good',
        },
        preferences: {
          battery: lead.preferences?.wantsBattery ?? false,
          financing: lead.preferences?.financingType || 'cash',
          timeline: lead.preferences?.timeline || '3-months',
          notes: lead.preferences?.notes || '',
        },
      };

      const annualProduction = lead.estimated_annual_production
        || (lead.system_size_kw ? Math.round(lead.system_size_kw * 1300) : 0);
      const transformedCalculations = {
        systemSizeKw: lead.system_size_kw || (annualProduction ? Math.round((annualProduction / 1300) * 100) / 100 : 0),
        estimatedAnnualProduction: annualProduction,
        estimatedMonthlyProduction: Math.round(annualProduction / 12),
        financing: [],
        environmental: {
          annualCO2Offset: Math.round(annualProduction * 0.386),
          treesEquivalent: Math.round(annualProduction * 0.386 / 21),
          gridIndependence: 80,
        },
        confidence: 'preliminary' as const,
      };

      const html = generateProposalHTML(transformedLeadData, transformedCalculations);
      const pdfBuffer = await generatePDFBlob(html);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="solar-proposal.pdf"',
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    }

    // Handle old format (leadData + calculations)
    if (!leadData || !calculations) {
      return NextResponse.json(
        { error: 'leadData and calculations (or lead) are required' },
        { status: 400 }
      );
    }

    // Generate HTML content
    const html = generateProposalHTML(leadData, calculations);

    // Generate PDF buffer
    const pdfBuffer = await generatePDFBlob(html);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="solar-proposal.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
