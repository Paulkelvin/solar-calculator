import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { SolarCalculationResult } from '../../types/calculations';
import { SYSTEM_COST_PER_WATT, FIXED_INSTALL_OVERHEAD, AVG_PRODUCTION_PER_KW, BASE_ELECTRICITY_RATE } from './calculations/solar';

interface FinancingCard {
  label: string;
  totalCost: number;
  yearOneSavings: number;
  yearTwoSavings: number;
  monthlyPayment?: number;
  roi: number;
}

interface EnvironmentalMetrics {
  co2OffsetTons: number;
  treeEquivalent: number;
}

/**
 * Generate HTML content for solar proposal PDF
 */
export function generateProposalHTML(
  leadData: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    usage: {
      monthlyBill?: number;
      annualKwh: number;
    };
    roof: {
      size: number;
      sunExposure: string;
    };
    preferences: {
      battery: boolean;
      financing: string;
      timeline: string;
      notes?: string;
    };
  },
  calculations: SolarCalculationResult
): string {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);

  // Transform financing data to match the card structure
  const safeName = leadData.name || 'Not provided';
  const safeEmail = leadData.email || 'Not provided';
  const safePhone = leadData.phone || 'Not provided';
  const safeStreet = leadData.address.street || '';
  const safeCityStateZip = `${leadData.address.city || ''}, ${leadData.address.state || ''} ${leadData.address.zip || ''}`.trim();
  const financingCards: FinancingCard[] = calculations.financing
    .filter(opt => opt.type !== 'ppa')
    .map((opt) => {
      const systemCost = FIXED_INSTALL_OVERHEAD + calculations.systemSizeKw * 1000 * SYSTEM_COST_PER_WATT;
      const annualSavings = calculations.estimatedAnnualProduction * BASE_ELECTRICITY_RATE;
    
      const typeLabels: Record<string, string> = {
        cash: '\u{1F4B0} Cash Purchase',
        loan: '\u{1F3E6} Solar Loan',
        lease: '\u{1F4CB} Solar Lease',
      };

      return {
        label: typeLabels[opt.type] || opt.type,
        totalCost: systemCost,
        yearOneSavings: annualSavings,
        yearTwoSavings: annualSavings,
        monthlyPayment: opt.monthlyPayment,
        roi: opt.roi
      };
    });

  // Convert environmental metrics from kg to metric tons
  const envMetrics: EnvironmentalMetrics = {
    co2OffsetTons: calculations.environmental.annualCO2Offset / 1000,
    treeEquivalent: calculations.environmental.treesEquivalent
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Solar Proposal Report</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            color: #111;
            line-height: 1.6;
            background: #fff;
          }
          .page {
            width: 8.5in;
            height: 11in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            border-bottom: 3px solid #d97706;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
          }
          .header h1 {
            font-size: 2rem;
            color: #d97706;
            margin-bottom: 0.25rem;
          }
          .header p {
            color: #666;
            font-size: 0.9rem;
          }
          .section {
            margin-bottom: 1.5rem;
          }
          .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #d97706;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5rem;
            margin-bottom: 0.75rem;
          }
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .info-box {
            background: #f9fafb;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border-left: 3px solid #d97706;
          }
          .info-label {
            font-size: 0.85rem;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-value {
            font-size: 1.1rem;
            color: #111;
            font-weight: 600;
            margin-top: 0.25rem;
          }
          .financing-card {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            border: 1px solid #e5e7eb;
          }
          .financing-card-title {
            font-size: 1rem;
            font-weight: 600;
            color: #111;
            margin-bottom: 0.5rem;
          }
          .card-row {
            display: flex;
            justify-content: space-between;
            padding: 0.4rem 0;
            font-size: 0.9rem;
          }
          .card-label {
            color: #6b7280;
          }
          .card-value {
            font-weight: 600;
            color: #111;
          }
          .highlight {
            background: #fef3c7;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            color: #b45309;
            font-weight: 600;
          }
          .environmental {
            background: #fffbeb;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #fef3c7;
          }
          .environmental-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 0.75rem;
          }
          .env-item {
            text-align: center;
          }
          .env-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: #d97706;
          }
          .env-label {
            font-size: 0.85rem;
            color: #6b7280;
            margin-top: 0.25rem;
          }
          .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            font-size: 0.8rem;
            color: #6b7280;
            text-align: center;
          }
          .badge {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <h1>☀️ Solar Proposal Report</h1>
            <p>Personalized Solar Estimate</p>
          </div>

          <!-- Property Information -->
          <div class="section">
            <div class="section-title">Property & Lead Information</div>
            <div class="two-column">
              <div class="info-box">
                <div class="info-label">Name</div>
                <div class="info-value">${safeName}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Email</div>
                <div class="info-value">${safeEmail}</div>
              </div>
            </div>
            <div class="two-column">
              <div class="info-box">
                <div class="info-label">Phone</div>
                <div class="info-value">${safePhone}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Address</div>
                <div class="info-value">
                  ${safeStreet}<br>
                  ${safeCityStateZip}
                </div>
              </div>
            </div>
          </div>

          <!-- System Information -->
          <div class="section">
            <div class="section-title">Estimated System Design</div>
            <div class="two-column">
              <div class="info-box">
                <div class="info-label">System Size</div>
                <div class="info-value">${calculations.systemSizeKw.toFixed(2)} kW</div>
              </div>
              <div class="info-box">
                <div class="info-label">Annual Production</div>
                <div class="info-value">${calculations.estimatedAnnualProduction.toLocaleString()} kWh</div>
              </div>
            </div>
            <div class="two-column">
              <div class="info-box">
                <div class="info-label">Roof Size</div>
                <div class="info-value">${leadData.roof.size} sqft</div>
              </div>
              <div class="info-box">
                <div class="info-label">Sun Exposure</div>
                <div class="info-value">${leadData.roof.sunExposure}</div>
              </div>
            </div>
          </div>

          <!-- Financing Options -->
          <div class="section">
            <div class="section-title">Financing Options</div>
            
            ${financingCards.map((card) => `
              <div class="financing-card">
                <div class="financing-card-title">${card.label}</div>
                <div class="card-row">
                  <span class="card-label">System Cost:</span>
                  <span class="card-value">${formatCurrency(card.totalCost)}</span>
                </div>
                ${card.monthlyPayment && card.monthlyPayment > 0 ? `
                <div class="card-row">
                  <span class="card-label">Monthly Payment:</span>
                  <span class="card-value">${formatCurrency(card.monthlyPayment)}</span>
                </div>
                ` : ''}
                <div class="card-row">
                  <span class="card-label">Annual Savings:</span>
                  <span class="card-value highlight">${formatCurrency(card.yearOneSavings)}</span>
                </div>
                <div class="card-row">
                  <span class="card-label">ROI:</span>
                  <span class="card-value">${card.roi.toFixed(1)}%</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Environmental Impact -->
          <div class="section">
            <div class="section-title">Environmental Impact (Annual)</div>
            <div class="environmental">
              <div class="environmental-grid">
                <div class="env-item">
                  <div class="env-number">${envMetrics.co2OffsetTons.toFixed(1)}</div>
                  <div class="env-label">Metric Tons CO₂</div>
                </div>
                <div class="env-item">
                  <div class="env-number">${envMetrics.treeEquivalent}</div>
                  <div class="env-label">Trees Equivalent</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Preferences -->
          <div class="section">
            <div class="section-title">Your Preferences</div>
            <div class="two-column">
              <div class="info-box">
                <div class="info-label">Battery Interest</div>
                <div class="info-value">${leadData.preferences.battery ? 'Yes' : 'No'}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Preferred Financing</div>
                <div class="info-value">${leadData.preferences.financing}</div>
              </div>
            </div>
            <div class="two-column">
              <div class="info-box">
                <div class="info-label">Timeline</div>
                <div class="info-value">${leadData.preferences.timeline}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Annual Usage</div>
                <div class="info-value">${leadData.usage.annualKwh.toLocaleString()} kWh</div>
              </div>
            </div>
            ${
              leadData.preferences.notes
                ? `
              <div class="info-box">
                <div class="info-label">Additional Notes</div>
                <div class="info-value">${leadData.preferences.notes}</div>
              </div>
            `
                : ''
            }
          </div>

          ${generateSolarAnalysisSection(calculations)}

          <!-- Footer -->
          <div class="footer">
            <p>This estimate is based on available solar data for your property. Final system design requires on-site assessment.</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate PDF blob from data using jsPDF
 * Structured PDF generation without HTML parsing
 */
export async function generatePDFBlob(htmlContent: string): Promise<Buffer> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const textWidth = pageWidth - 2 * margin;
    let y = margin;
    
    // Helper to add new page if needed
    const checkPageBreak = (neededSpace: number = 10) => {
      if (y + neededSpace > pageHeight - margin) {
        pdf.addPage();
        y = margin;
        return true;
      }
      return false;
    };

    // Helper to add section title
    let isFirstSection = true;
    const addSectionTitle = (title: string) => {
      // Add breathing room above every section except the first
      if (!isFirstSection) {
        y += 8;
      }
      isFirstSection = false;
      checkPageBreak(15);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 185, 129); // Green color
      pdf.text(title, margin, y);
      y += 5;
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
    };

    // Helper to add info box
    const addInfoBox = (label: string, value: string, x: number, width: number) => {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(x, y, width, 15, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(label.toUpperCase(), x + 3, y + 5);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(17, 17, 17);
      const wrappedValue = pdf.splitTextToSize(value, width - 6);
      pdf.text(wrappedValue, x + 3, y + 10);
    };

    // ===== HEADER =====
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Solar Proposal Report', margin, 12);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Personalized Solar Estimate', margin, 18);
    
    y = 35;

    // Extract data from HTML (regex pattern matching)
    const extractValue = (pattern: RegExp): string => {
      const match = htmlContent.match(pattern);
      return match ? match[1].trim() : 'N/A';
    };

    const name = extractValue(/Name<\/div>\s*<div class="info-value">([^<]+)/);
    const email = extractValue(/Email<\/div>\s*<div class="info-value">([^<]+)/);
    const phone = extractValue(/Phone<\/div>\s*<div class="info-value">([^<]+)/);
    const street = extractValue(/Address<\/div>\s*<div class="info-value">\s*([^<]+)<br>/);
    const cityStateZip = extractValue(/Address<\/div>\s*<div class="info-value">\s*[^<]+<br>\s*([^<]+)/);
    const systemSize = extractValue(/System Size<\/div>\s*<div class="info-value">([^<]+)/);
    const annualProd = extractValue(/Annual Production<\/div>\s*<div class="info-value">([^<]+)/);
    const roofSize = extractValue(/Roof Size<\/div>\s*<div class="info-value">([^<]+)/);
    const sunExposure = extractValue(/Sun Exposure<\/div>\s*<div class="info-value">([^<]+)/);

    // ===== PROPERTY INFORMATION =====
    addSectionTitle('Property & Lead Information');
    
    const colWidth = (textWidth - 5) / 2;
    addInfoBox('NAME', name, margin, colWidth);
    addInfoBox('EMAIL', email, margin + colWidth + 5, colWidth);
    y += 20;
    
    checkPageBreak(20);
    addInfoBox('PHONE', phone, margin, colWidth);
    addInfoBox('ADDRESS', `${street}\n${cityStateZip}`, margin + colWidth + 5, colWidth);
    y += 20;

    // ===== SYSTEM DESIGN =====
    addSectionTitle('Estimated System Design');
    
    addInfoBox('SYSTEM SIZE', systemSize, margin, colWidth);
    addInfoBox('ANNUAL PRODUCTION', annualProd, margin + colWidth + 5, colWidth);
    y += 20;
    
    checkPageBreak(20);
    addInfoBox('ROOF SIZE', roofSize, margin, colWidth);
    addInfoBox('SUN EXPOSURE', sunExposure, margin + colWidth + 5, colWidth);
    y += 20;

    // ===== FINANCING =====
    addSectionTitle('Financing Options');
    
    // Extract all financing cards from HTML dynamically
    const cardTitles = ['Cash Purchase', 'Solar Loan', 'Solar Lease'];
    for (const title of cardTitles) {
      // Check if this card exists in HTML
      const titleRegex = new RegExp(`${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      if (!titleRegex.test(htmlContent)) continue;

      checkPageBreak(35);
      pdf.setFillColor(243, 244, 246);
      pdf.roundedRect(margin, y, textWidth, 30, 2, 2, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(17, 17, 17);
      pdf.text(title, margin + 3, y + 6);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cost = extractValue(new RegExp(`${escapedTitle}[\\s\\S]*?System Cost:[\\s\\S]*?<span class="card-value">([^<]+)`));
      const savings = extractValue(new RegExp(`${escapedTitle}[\\s\\S]*?Annual Savings:[\\s\\S]*?<span class="card-value[^>]*>([^<]+)`));
      const roi = extractValue(new RegExp(`${escapedTitle}[\\s\\S]*?ROI:[\\s\\S]*?<span class="card-value">([^<]+)`));
      const monthly = extractValue(new RegExp(`${escapedTitle}[\\s\\S]*?Monthly Payment:[\\s\\S]*?<span class="card-value">([^<]+)`));
      
      let lineY = y + 12;
      pdf.text(`System Cost: ${cost}`, margin + 3, lineY);
      lineY += 6;
      if (monthly && monthly !== 'N/A') {
        pdf.text(`Monthly Payment: ${monthly}`, margin + 3, lineY);
        lineY += 6;
      }
      pdf.text(`Annual Savings: ${savings}`, margin + 3, lineY);
      lineY += 6;
      pdf.text(`ROI: ${roi}`, margin + 3, lineY);
      
      y += 35;
    }

    // ===== ENVIRONMENTAL =====
    addSectionTitle('Environmental Impact (Annual)');
    
    checkPageBreak(25);
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, y, textWidth, 20, 2, 2, 'F');
    
    const co2 = extractValue(/Metric Tons CO[₂2]<\/div>\s*<\/div>\s*<div class="env-item">\s*<div class="env-number">([^<]+)/);
    const trees = extractValue(/<div class="env-number">([^<]+)<\/div>\s*<div class="env-label">Trees Equivalent/);
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(16, 185, 129);
    const centerX = pageWidth / 2;
    pdf.text(`${co2} Metric Tons CO2`, centerX, y + 8, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text(`${trees} Trees Equivalent`, centerX, y + 16, { align: 'center' });
    
    y += 25;

    // ===== FOOTER =====
    checkPageBreak(15);
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    const footerText = 'This estimate is based on available solar data for your property. Final system design requires on-site assessment.';
    const wrappedFooter = pdf.splitTextToSize(footerText, textWidth);
    pdf.text(wrappedFooter, pageWidth / 2, y, { align: 'center' });
    
    y += wrappedFooter.length * 4 + 3;
    const dateText = `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    pdf.text(dateText, pageWidth / 2, y, { align: 'center' });

    // Return as buffer
    return Buffer.from(pdf.output('arraybuffer'));
  } catch (error) {
    throw new Error('PDF generation failed: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Enhanced PDF section with real solar data and incentives
 * Phase 5.2 Week 2-3: Include actual solar metrics and incentive breakdown
 */
export function generateSolarAnalysisSection(calculations: SolarCalculationResult): string {
  if (!calculations.incentives) {
    return ''; // Skip if no incentive data
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);

  const incentives = calculations.incentives;

  return `
    <!-- Solar Analysis & Incentives (Real Data) -->
    <div class="section">
      <div class="section-title">Real Solar Analysis & Incentives</div>
      
      <div style="background: #f0f9ff; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 12px;">
        <strong>📊 Data Source:</strong> ${
          incentives.state ? `Real Google Solar API data for ${incentives.state}` : 'Estimated'
        }
      </div>

      <div class="two-column">
        <div class="info-box">
          <div class="info-label">System Size</div>
          <div class="info-value">${calculations.systemSizeKw} kW</div>
        </div>
        <div class="info-box">
          <div class="info-label">Annual Production</div>
          <div class="info-value">${calculations.estimatedAnnualProduction.toLocaleString()} kWh</div>
        </div>
      </div>

      <div style="margin-top: 16px; border-top: 1px solid #e0e0e0; padding-top: 12px;">
        <div style="font-weight: bold; margin-bottom: 8px;">Available Incentives & Savings:</div>
        <div class="two-column">
          <div class="info-box">
            <div class="info-label">First-Year Rebates</div>
            <div class="info-value">${formatCurrency(incentives.totalFirstYearIncentives)}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Annual Net Metering</div>
            <div class="info-value">${formatCurrency(incentives.netMeteringAnnualValue)}</div>
          </div>
        </div>
        ${
          incentives.availableIncentives.length > 0
            ? `
        <div style="margin-top: 12px; font-size: 11px;">
          <strong>Available in ${incentives.state}:</strong><br/>
          ${incentives.availableIncentives.map((i) => `• ${i}`).join('<br/>')}
        </div>
        `
            : ''
        }
        <div style="margin-top: 12px; padding: 8px; background: #fff3cd; border-left: 3px solid #ffc107; font-size: 11px;">
          <strong>ℹ️ Important:</strong> ${incentives.disclaimer}
        </div>
      </div>
    </div>
  `;
}

