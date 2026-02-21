import { Resend } from 'resend';
import { EmailTemplates } from './templates';

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@testingground.sbs';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Solar ROI Calculator';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || 'support@testingground.sbs';
const INSTALLER_EMAIL = process.env.INSTALLER_EMAIL || 'installer@testingground.sbs';

/**
 * Get Resend client (instantiated at runtime)
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send welcome email to new admin/installer after email confirmation
 */
export async function sendWelcomeEmail(installerEmail: string) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('RESEND_API_KEY not configured - skipping welcome email');
      return { success: false, reason: 'API key not configured' };
    }

    const template = EmailTemplates.welcomeEmail(installerEmail);

    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: installerEmail,
      reply_to: REPLY_TO_EMAIL,
      subject: template.subject,
      html: template.html,
      text: template.text,
      headers: {
        'X-Entity-Ref-ID': `welcome-${Date.now()}`,
      },
    });

    if (result.error) {
      console.error('Failed to send welcome email:', result.error);
      return { success: false, error: result.error };
    }

    console.log('Welcome email sent successfully to:', installerEmail);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Welcome email send error:', error);
    return { success: false, error };
  }
}

/**
 * Send customer submission confirmation email
 */
export async function sendCustomerSubmissionEmail(
  customerEmail: string,
  customerName: string,
  systemSize: number,
  annualProduction: number,
  address: string
) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('RESEND_API_KEY not configured - skipping email');
      return { success: false, reason: 'API key not configured' };
    }

    const template = EmailTemplates.customerSubmissionEmail(
      customerName,
      `${systemSize.toFixed(2)} kW`,
      `${Math.round(annualProduction).toLocaleString()} kWh`,
      address
    );

    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: customerEmail,
      reply_to: REPLY_TO_EMAIL,
      subject: template.subject,
      html: template.html,
      text: template.text,
      headers: {
        'X-Entity-Ref-ID': `customer-${Date.now()}`,
      },
    });

    if (result.error) {
      console.error('Failed to send customer email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Customer email send error:', error);
    return { success: false, error };
  }
}

/**
 * Send installer lead notification email
 */
export async function sendInstallerLeadEmail(
  installerName: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  systemSize: number,
  address: string,
  leadScore: number
) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('RESEND_API_KEY not configured - skipping email');
      return { success: false, reason: 'API key not configured' };
    }

    const template = EmailTemplates.installerLeadEmail(
      installerName,
      customerName,
      customerEmail,
      customerPhone,
      `${systemSize.toFixed(2)} kW`,
      address,
      leadScore
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: INSTALLER_EMAIL,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.error) {
      console.error('Failed to send installer email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Installer email send error:', error);
    return { success: false, error };
  }
}

/**
 * Send test email (for debugging)
 */
export async function sendTestEmail(toEmail: string) {
  try {
    const resend = getResendClient();
    if (!resend) {
      return { success: false, reason: 'API key not configured' };
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Test Email from Solar Calculator',
      html: '<h1>Test Email</h1><p>This is a test email from Solar Calculator.</p>',
      text: 'Test email from Solar Calculator',
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    return { success: false, error };
  }
}
