import { Resend } from 'resend';
import { EmailTemplates } from './templates';

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@testingground.sbs';
// Force a neutral, non-promotional display name to avoid spam triggers
const FROM_NAME = 'Solar Estimate Team';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO || 'support@testingground.sbs';
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
 * Format email sender with proper validation
 * Resend requires: "email@example.com" or "Name <email@example.com>"
 */
function formatFromEmail(emailRaw: string, nameRaw?: string): string {
  // Strip surrounding quotes/whitespace
  const trimmed = emailRaw.trim().replace(/^[\"']|[\"']$/g, '');

  // If env already contains `Name <email@...>`, extract the email
  const bracketMatch = trimmed.match(/<([^>]+)>/);
  const extractedEmail = bracketMatch?.[1]?.trim();

  // Derive name: prefer explicit nameRaw, otherwise take text before the bracket
  const derivedNameRaw = nameRaw
    ?.trim()
    .replace(/^[\"']|[\"']$/g, '')
    .replace(/[<>]/g, '') || (bracketMatch ? trimmed.split('<')[0].trim().replace(/^[\"']|[\"']$/g, '') : '');

  // Hard override to remove ROI or other promotional terms from display name
  const neutralName = derivedNameRaw && /roi/i.test(derivedNameRaw)
    ? 'Solar Estimate Team'
    : derivedNameRaw || 'Solar Estimate Team';

  const email = extractedEmail || trimmed;

  // Basic email validation; if invalid, return raw to let Resend surface a clear error
  const isValidEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!isValidEmail) {
    return email;
  }

  const cleanName = neutralName?.trim();
  if (!cleanName) {
    return email;
  }

  return `${cleanName} <${email}>`;
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
      from: formatFromEmail(FROM_EMAIL, FROM_NAME),
      to: installerEmail,
      replyTo: formatFromEmail(REPLY_TO_EMAIL, FROM_NAME),
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
  address: string,
  options?: {
    pdfAttachment?: {
      filename: string;
      content: Buffer;
    };
    shareToken?: string;
    calendlyUrl?: string;
  }
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
      address,
      options?.shareToken,
      options?.calendlyUrl
    );

    const emailPayload = {
      from: formatFromEmail(FROM_EMAIL, FROM_NAME),
      to: customerEmail,
      replyTo: formatFromEmail(REPLY_TO_EMAIL, FROM_NAME),
      subject: template.subject,
      html: template.html,
      text: template.text,
      headers: {
        'X-Entity-Ref-ID': `customer-${Date.now()}`,
        'List-Unsubscribe': `<mailto:${REPLY_TO_EMAIL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      attachments: options?.pdfAttachment
        ? [
            {
              filename: options.pdfAttachment.filename,
              content: options.pdfAttachment.content,
            },
          ]
        : undefined,
    };
    
    console.log('[sendCustomerSubmissionEmail] Email configuration:', {
      rawFromEmail: FROM_EMAIL,
      rawFromName: FROM_NAME,
      formattedFrom: emailPayload.from,
      to: emailPayload.to,
      replyTo: emailPayload.replyTo,
      subject: emailPayload.subject,
    });

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error('[sendCustomerSubmissionEmail] Resend API error:', {
        error: result.error,
        message: result.error.message,
        name: result.error.name,
      });
      return { success: false, error: result.error };
    }

    console.log('[sendCustomerSubmissionEmail] Success! Message ID:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[sendCustomerSubmissionEmail] Exception:', error);
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
      from: formatFromEmail(FROM_EMAIL, FROM_NAME),
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
      from: formatFromEmail(FROM_EMAIL, FROM_NAME),
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

/**
 * Send installer notification when customer schedules an appointment
 */
export async function sendInstallerAppointmentEmail(options: {
  installerEmail: string;
  leadData: {
    customerName: string;
    customerEmail: string;
    appointmentTime: string;
    estimateUrl: string;
    dashboardUrl: string;
    leadId: string;
  };
}) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('RESEND_API_KEY not configured - skipping installer notification');
      return { success: false, reason: 'API key not configured' };
    }

    const template = EmailTemplates.installerAppointmentEmail(options.leadData);

    // Use installer email from env if provided, otherwise use the one passed in
    const recipientEmail = INSTALLER_EMAIL || options.installerEmail;

    const result = await resend.emails.send({
      from: formatFromEmail(FROM_EMAIL, FROM_NAME),
      to: recipientEmail,
      replyTo: options.leadData.customerEmail, // Reply goes to customer
      subject: template.subject,
      html: template.html,
      text: template.text,
      headers: {
        'X-Entity-Ref-ID': `lead-${options.leadData.leadId}`,
      },
    });

    if (result.error) {
      console.error('Installer appointment email send error:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Installer appointment email send error:', error);
    return { success: false, error };
  }
}
