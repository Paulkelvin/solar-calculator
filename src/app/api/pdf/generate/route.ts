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
      const transformedLeadData = {
        name: lead.contact?.name || 'Customer',
        email: lead.contact?.email || '',
        phone: lead.contact?.phone || '',
        address: lead.address,
        usage: lead.usage,
        roof: lead.roof,
        preferences: lead.preferences,
      };

      const transformedCalculations = {
        systemSizeKw: lead.system_size_kw || 0,
        estimatedAnnualProduction: lead.estimated_annual_production || 0,
        financing: [], // Could be expanded later
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
