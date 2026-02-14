/**
 * Email templates for Solar Calculator
 * These are plain text and HTML templates for customer and installer emails
 */

export const EmailTemplates = {
  /**
   * Customer email after lead submission
   */
  customerSubmissionEmail: (customerName: string, systemSize: string, annualProduction: string, address: string) => ({
    subject: '☀️ Your Solar Estimate is Ready!',
    text: `Hi ${customerName},

Thank you for using our Solar ROI Calculator! We've analyzed your property and generated a personalized solar estimate.

📊 Your Solar System:
- Estimated System Size: ${systemSize} kW
- Expected Annual Production: ${annualProduction} kWh/year
- Property: ${address}

💡 Next Steps:
1. Review your detailed estimate (attached PDF)
2. Compare financing options (Cash, Loan, Lease, PPA)
3. Schedule a consultation with our team

Our solar experts will contact you shortly to discuss your project and answer any questions.

Questions? Reply to this email or call us directly.

Best regards,
Solar Installation Team

---
This is an automated message. Please do not reply with sensitive information.`,
    html: `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #d97706 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 28px; }
    .section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #d97706; }
    .section h2 { color: #d97706; margin-top: 0; }
    .metric { display: inline-block; width: 48%; margin: 10px 1%; padding: 15px; background: white; border-radius: 4px; text-align: center; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #d97706; margin-top: 5px; }
    .cta-button { display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 4px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>☀️ Your Solar Estimate is Ready!</h1>
      <p>Personalized analysis for your property</p>
    </div>

    <p>Hi ${customerName},</p>

    <p>Thank you for using our Solar ROI Calculator! We've analyzed your property and generated a personalized solar estimate based on your location, roof specifications, and energy usage.</p>

    <div class="section">
      <h2>📊 Your Solar System</h2>
      <div class="metric">
        <div class="metric-label">System Size</div>
        <div class="metric-value">${systemSize} kW</div>
      </div>
      <div class="metric">
        <div class="metric-label">Annual Production</div>
        <div class="metric-value">${annualProduction} kWh</div>
      </div>
      <div style="clear: both;"></div>
      <p><strong>Property:</strong> ${address}</p>
    </div>

    <div class="section">
      <h2>💡 Next Steps</h2>
      <ol>
        <li><strong>Review Your Estimate</strong> - Download and review the detailed PDF report</li>
        <li><strong>Compare Financing Options</strong> - Explore Cash, Loan, Lease, and PPA scenarios</li>
        <li><strong>Schedule a Consultation</strong> - Our team will contact you to discuss your project</li>
      </ol>
    </div>

    <p style="text-align: center;">
      <a href="https://solar-calculator.example.com" class="cta-button">View Full Estimate</a>
    </p>

    <p>Our solar experts will review your estimate and contact you shortly to discuss financing options and answer any questions you may have.</p>

    <p><strong>Questions?</strong> Reply to this email or contact us directly.</p>

    <div class="footer">
      <p>This is an automated message from our Solar ROI Calculator. For inquiries, please contact our solar team.</p>
      <p>&copy; 2026 Solar Installation Team. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  }),

  /**
   * Installer email when new lead is submitted
   */
  installerLeadEmail: (installerName: string, customerName: string, email: string, phone: string, systemSize: string, address: string, leadScore: number) => ({
    subject: `📌 New Lead: ${customerName} (${systemSize} kW)`,
    text: `Hi ${installerName},

A new solar lead has been submitted to your dashboard!

👤 Customer Information:
- Name: ${customerName}
- Email: ${email}
- Phone: ${phone}

☀️ System Details:
- Estimated System Size: ${systemSize} kW
- Property: ${address}
- Lead Score: ${leadScore}/100

📊 Next Steps:
1. Log into your dashboard: https://solar-calculator.example.com/dashboard
2. Review the full lead details and financing scenarios
3. Download the customer's PDF estimate
4. Contact the customer to schedule a consultation

Lead Score Guide:
- 80-100: Hot lead (high financing interest)
- 60-79: Warm lead (moderate interest)
- Below 60: Follow-up needed

---
Solar ROI Calculator Admin Team`,
    html: `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #d97706 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #d97706; }
    .section h3 { color: #d97706; margin-top: 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: bold; color: #6b7280; }
    .lead-score { display: inline-block; font-size: 32px; font-weight: bold; color: #d97706; margin: 10px 0; }
    .cta-button { display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 4px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📌 New Lead: ${customerName}</h1>
      <p>${systemSize} kW System</p>
    </div>

    <p>Hi ${installerName},</p>

    <p>Great news! A new solar lead has been submitted to your dashboard. Review the details below and reach out to the customer to schedule a consultation.</p>

    <div class="section">
      <h3>👤 Customer Information</h3>
      <div class="info-row">
        <span class="info-label">Name:</span>
        <span>${customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span>${email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span>${phone}</span>
      </div>
    </div>

    <div class="section">
      <h3>☀️ System Details</h3>
      <div class="info-row">
        <span class="info-label">System Size:</span>
        <span>${systemSize} kW</span>
      </div>
      <div class="info-row">
        <span class="info-label">Property Address:</span>
        <span>${address}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Lead Score:</span>
        <span><strong class="lead-score">${leadScore}</strong> / 100</span>
      </div>
    </div>

    <div class="section">
      <h3>📊 Lead Score Guide</h3>
      <ul>
        <li><strong>80-100:</strong> Hot lead (high financing interest)</li>
        <li><strong>60-79:</strong> Warm lead (moderate interest)</li>
        <li><strong>Below 60:</strong> Follow-up needed</li>
      </ul>
    </div>

    <p style="text-align: center;">
      <a href="https://solar-calculator.example.com/dashboard" class="cta-button">View in Dashboard</a>
    </p>

    <p>Log into your dashboard to view the complete lead details, including the customer's financing scenarios and PDF estimate.</p>

    <div class="footer">
      <p>This is an automated message from Solar ROI Calculator. Do not reply with sensitive information.</p>
      <p>&copy; 2026 Solar Calculator. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  }),
};
