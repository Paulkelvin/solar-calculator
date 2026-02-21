/**
 * Email templates for Solar Calculator
 * These are plain text and HTML templates for customer and installer emails
 */

export const EmailTemplates = {
  /**
   * Welcome email for new admin/installer signup
   */
  welcomeEmail: (installerEmail: string) => ({
    subject: 'Welcome to Solar ROI Calculator - Account Activated',
    text: `Welcome to Solar ROI Calculator!

Your admin account has been successfully activated. You can now access your dashboard to manage solar leads and proposals.

📊 What you can do:
- Track and manage solar leads
- Access detailed customer proposals
- View lead scores and engagement metrics
- Manage your installer profile

🚀 Get Started:
Log into your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://testingground.sbs'}/dashboard

Need help? Reply to this email and our support team will assist you.

Best regards,
Solar ROI Calculator Team

---
This is an automated welcome message.`,
    html: `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 10px 0; font-size: 32px; }
    .section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #d97706; }
    .section h2 { color: #d97706; margin-top: 0; font-size: 20px; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .feature-list li:last-child { border-bottom: none; }
    .feature-list li:before { content: "✓ "; color: #d97706; font-weight: bold; margin-right: 8px; }
    .cta-button { display: inline-block; background: #d97706; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px; }
    .cta-button:hover { background: #b45309; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 4px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Solar ROI Calculator!</h1>
      <p style="margin: 0; font-size: 18px;">Your account is now active</p>
    </div>

    <p style="font-size: 16px;">Hi there,</p>

    <p>Congratulations! Your admin account for Solar ROI Calculator has been successfully activated. You now have access to powerful tools for managing solar leads and proposals.</p>

    <div class="section">
      <h2>📊 What You Can Do</h2>
      <ul class="feature-list">
        <li><strong>Track Leads:</strong> View and manage all solar leads submitted through your calculator</li>
        <li><strong>Access Proposals:</strong> Review detailed customer proposals with financing scenarios</li>
        <li><strong>Lead Scoring:</strong> See lead quality scores and engagement metrics</li>
        <li><strong>Profile Management:</strong> Update your installer profile and company information</li>
      </ul>
    </div>

    <div class="section">
      <h2>🚀 Get Started</h2>
      <p>Ready to dive in? Access your dashboard to start managing leads:</p>
      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://testingground.sbs'}/dashboard" class="cta-button">Go to Dashboard</a>
      </p>
    </div>

    <p><strong>Need Help?</strong> Reply to this email and our support team will be happy to assist you with getting started.</p>

    <p>Welcome aboard!</p>
    <p><strong>The Solar ROI Calculator Team</strong></p>

    <div class="footer">
      <p>This is an automated welcome message sent to ${installerEmail}.</p>
      <p>If you didn't request this, please reply and we'll investigate.</p>
      <p>&copy; ${new Date().getFullYear()} Solar ROI Calculator. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  }),

  /**
   * Customer email after lead submission
   */
  customerSubmissionEmail: (customerName: string, systemSize: string, annualProduction: string, address: string, shareToken?: string) => {
    const estimateUrl = shareToken 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://testingground.sbs'}/estimate/${shareToken}`
      : undefined;

    return {
    subject: `Your solar estimate is ready`,
    text: `Hi ${customerName},

Thank you for requesting a solar estimate. We've analyzed your property and prepared a customized solar system proposal.

YOUR RECOMMENDED SOLAR SYSTEM:
- Recommended System Size: ${systemSize}
- Estimated Annual Production: ${annualProduction}
- Property Address: ${address}

${estimateUrl ? `VIEW YOUR ESTIMATE ONLINE:\n${estimateUrl}\n\n` : ''}WHAT HAPPENS NEXT:
1. A solar consultant will review your estimate and contact you within 1-2 business days
2. Review your detailed proposal online (link above) or in the attached PDF
3. Share the link with family to discuss your solar options together
4. When ready, schedule a free site assessment with our team

Questions? Simply reply to this email or call us at (555) 123-4567.

Best regards,
Solar Estimate Team

---
You received this email because you requested a solar estimate at ${process.env.NEXT_PUBLIC_APP_URL || 'https://testingground.sbs'}. If this wasn't you, reply and we'll investigate.`,
    html: `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f97316; color: white; padding: 24px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.95; }
    .content { padding: 30px 20px; background-color: #ffffff; }
    .section { margin-bottom: 24px; }
    .section h2 { color: #1f2937; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .info-table td:first-child { font-weight: 600; color: #6b7280; width: 40%; }
    .info-table td:last-child { color: #1f2937; }
    .cta-button { display: inline-block; background-color: #f97316; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 500; }
    .cta-button:hover { background-color: #ea580c; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Solar Estimate</h1>
      <p>Estimate for ${address}</p>
    </div>

    <div class="content">
      <p>Hi ${customerName},</p>

      <p>Thank you for requesting a solar estimate. We've analyzed your property details and prepared a customized solar system proposal.</p>

      <div class="section">
        <h2>Your Recommended Solar System</h2>
        <table class="info-table">
          <tr>
            <td>Recommended System Size</td>
            <td>${systemSize}</td>
          </tr>
          <tr>
            <td>Estimated Annual Production</td>
            <td>${annualProduction}</td>
          </tr>
          <tr>
            <td>Property Address</td>
            <td>${address}</td>
          </tr>
        </table>
      </div>

      ${estimateUrl ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">📊 View Your Estimate Online</p>
        <p style="margin: 0 0 12px 0; color: #78350f; font-size: 14px;">Access your detailed proposal anytime, anywhere:</p>
        <a href="${estimateUrl}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Full Estimate</a>
        <p style="margin: 12px 0 0 0; color: #78350f; font-size: 12px;">Share this link with family to discuss your solar options together</p>
      </div>
      ` : ''}

      <div class="section">
        <h2>What Happens Next</h2>
        <ol style="margin: 8px 0 0 20px; padding: 0;">
          <li style="margin-bottom: 8px;">A solar consultant will review your estimate and contact you within 1-2 business days</li>
          <li style="margin-bottom: 8px;">Review your detailed proposal online (link above) or in the attached PDF</li>
          <li style="margin-bottom: 8px;">Share the link with family to discuss your solar options together</li>
          <li style="margin-bottom: 8px;">When ready, schedule a free site assessment with our team</li>
        </ol>
      </div>

      <p style="margin-top: 20px;">Questions? Simply reply to this email or call us at (555) 123-4567.</p>

      <p style="margin-top: 20px;">Best regards,<br><strong>Solar Estimate Team</strong></p>
    </div>

    <div class="footer">
      <p>You received this email because you requested a solar estimate at ${process.env.NEXT_PUBLIC_APP_URL || 'https://testingground.sbs'}.</p>
      <p>If this wasn't you, please reply and we'll investigate.</p>
      <p>&copy; ${new Date().getFullYear()} Solar Estimate Team. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    };
  },

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
