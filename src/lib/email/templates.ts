/**
 * Email templates for Solar Calculator
 * These are plain text and HTML templates for customer and installer emails
 */

export const EmailTemplates = {
  /**
   * Welcome email for new admin/installer signup
   */
  welcomeEmail: (installerEmail: string) => ({
    subject: '🎉 Welcome to Solar ROI Calculator',
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
      <p>This is an automated welcome message sent to ${installerEmail}</p>
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
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://testingground.sbs'}" class="cta-button">View Full Estimate</a>
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
