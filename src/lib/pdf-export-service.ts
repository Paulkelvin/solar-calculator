/**
 * PDF Export Service
 * Phase 3: Generate personalized solar roadmap PDFs
 * 
 * Uses react-pdf for chart embedding and professional formatting
 * Psychology framing: "Your Personalized Solar Roadmap"
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportData {
  // Customer info
  customerName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  
  // System details
  systemSizeKw: number;
  panelCount: number;
  annualProductionKwh: number;
  roofArea: number;
  
  // Financial data
  systemCost: number;
  financing: 'cash' | 'loan' | 'lease' | 'ppa';
  yearOneSavings: number;
  year25Savings: number;
  paybackYears: number;
  roi: number;
  
  // Incentives
  stateRebates: number;
  netMeteringValue: number;
  leasingSavings?: number;
  
  // Environmental impact
  co2OffsetLbs: number;
  treesEquivalent: number;
  carsOffRoad: number;
  
  // Charts (as data URLs from html2canvas)
  cashFlowChartUrl?: string;
  environmentalChartUrl?: string;
  productionChartUrl?: string;
}

/**
 * Generate PDF report with charts and summary
 */
export async function generatePDF(data: PDFExportData): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  let yPosition = 20;
  
  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(59, 130, 246); // Blue
  pdf.text('Your Personalized Solar Roadmap', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`${data.address}, ${data.city}, ${data.state} ${data.zip}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // System Summary Box
  pdf.setFillColor(240, 249, 255); // Light blue
  pdf.rect(15, yPosition, pageWidth - 30, 40, 'F');
  
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('System Overview', 20, yPosition + 8);
  
  pdf.setFontSize(10);
  pdf.text(`System Size: ${data.systemSizeKw.toFixed(1)} kW (${data.panelCount} panels)`, 20, yPosition + 16);
  pdf.text(`Annual Production: ${data.annualProductionKwh.toLocaleString()} kWh`, 20, yPosition + 24);
  pdf.text(`Roof Area Used: ${data.roofArea} sq ft`, 20, yPosition + 32);
  
  yPosition += 50;
  
  // Financial Summary
  pdf.setFillColor(254, 249, 231); // Light yellow
  pdf.rect(15, yPosition, pageWidth - 30, 50, 'F');
  
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Financial Projections', 20, yPosition + 8);
  
  pdf.setFontSize(10);
  pdf.text(`Total Investment: $${data.systemCost.toLocaleString()}`, 20, yPosition + 16);
  pdf.text(`Financing: ${data.financing.toUpperCase()}`, 20, yPosition + 24);
  pdf.text(`Year 1 Savings: $${Math.round(data.yearOneSavings).toLocaleString()}`, 20, yPosition + 32);
  pdf.text(`25-Year Savings: $${Math.round(data.year25Savings).toLocaleString()}`, 20, yPosition + 40);
  
  pdf.text(`Payback Period: ${data.paybackYears.toFixed(1)} years`, pageWidth / 2 + 10, yPosition + 16);
  pdf.text(`Return on Investment: ${data.roi.toFixed(0)}%`, pageWidth / 2 + 10, yPosition + 24);
  
  yPosition += 60;
  
  // Incentives (if applicable)
  if (data.stateRebates > 0 || data.netMeteringValue > 0) {
    pdf.setFillColor(240, 253, 244); // Light green
    pdf.rect(15, yPosition, pageWidth - 30, 35, 'F');
    
    pdf.setFontSize(14);
    pdf.text('Available Incentives', 20, yPosition + 8);
    
    pdf.setFontSize(10);
    if (data.stateRebates > 0) {
      pdf.text(`State Rebates: $${Math.round(data.stateRebates).toLocaleString()}`, 20, yPosition + 16);
    }
    if (data.netMeteringValue > 0) {
      pdf.text(`Net Metering Value (Annual): $${Math.round(data.netMeteringValue).toLocaleString()}`, 20, yPosition + 24);
    }
    if (data.leasingSavings) {
      pdf.text(`Leasing Savings (Annual): $${Math.round(data.leasingSavings).toLocaleString()}`, 20, yPosition + 32);
    }
    
    yPosition += 45;
  }
  
  // Environmental Impact
  pdf.setFillColor(236, 253, 245); // Light teal
  pdf.rect(15, yPosition, pageWidth - 30, 40, 'F');
  
  pdf.setFontSize(14);
  pdf.text('Environmental Impact (25 Years)', 20, yPosition + 8);
  
  pdf.setFontSize(10);
  pdf.text(`🌍 CO₂ Offset: ${(data.co2OffsetLbs / 1000).toFixed(1)} tons`, 20, yPosition + 16);
  pdf.text(`🌳 Trees Planted Equivalent: ${data.treesEquivalent.toLocaleString()}`, 20, yPosition + 24);
  pdf.text(`🚗 Cars Off Road Equivalent: ${data.carsOffRoad.toFixed(1)} cars`, 20, yPosition + 32);
  
  // Page 2: Charts
  pdf.addPage();
  yPosition = 20;
  
  pdf.setFontSize(18);
  pdf.setTextColor(59, 130, 246);
  pdf.text('Financial & Production Analysis', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // Embed charts (if provided)
  if (data.cashFlowChartUrl) {
    pdf.addImage(data.cashFlowChartUrl, 'PNG', 15, yPosition, pageWidth - 30, 60);
    yPosition += 70;
  }
  
  if (data.productionChartUrl) {
    pdf.addImage(data.productionChartUrl, 'PNG', 15, yPosition, pageWidth - 30, 60);
    yPosition += 70;
  }
  
  if (data.environmentalChartUrl) {
    pdf.addImage(data.environmentalChartUrl, 'PNG', 15, yPosition, pageWidth - 30, 60);
  }
  
  // Footer on all pages
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  return pdf.output('blob');
}

/**
 * Capture chart as data URL for PDF embedding
 */
export async function captureChartAsDataURL(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }
  
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher resolution
  });
  
  return canvas.toDataURL('image/png');
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string = 'solar-roadmap.pdf') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate shareable link (store in Supabase)
 */
export async function generateShareableLink(pdfBlob: Blob, leadId: string): Promise<string> {
  // Upload PDF to Supabase Storage
  const formData = new FormData();
  formData.append('file', pdfBlob, `${leadId}.pdf`);
  
  const response = await fetch('/api/upload-pdf', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload PDF');
  }
  
  const { url } = await response.json();
  return url;
}
