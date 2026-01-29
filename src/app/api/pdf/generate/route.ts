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

    const { leadData, calculations } = body;

    if (!leadData || !calculations) {
      return NextResponse.json(
        { error: 'leadData and calculations are required' },
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
