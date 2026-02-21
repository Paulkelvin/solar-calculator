# Calendly Webhook Setup Guide

This guide explains how to configure Calendly webhooks to automatically notify your team when customers schedule appointments.

## Overview

When a customer books an appointment via the shareable estimate link, Calendly sends a webhook to your app, which:
1. Updates the lead with appointment details
2. Changes lead status to "contacted"
3. Sends an email notification to the installer team

## Prerequisites

- Active Calendly account (Professional plan or higher required for webhooks)
- Deployed app with webhook endpoint: `https://your-domain.com/api/booking/webhook`
- Supabase configured with leads table
- Resend configured for email notifications

## Step 1: Get Your Calendly API Token

1. Go to https://calendly.com/integrations/api_webhooks
2. Click "Get your API key"
3. Save your API key securely (you'll need it to create webhooks)

## Step 2: Configure Your Calendly Event Type URL

1. Go to your Calendly dashboard
2. Navigate to your event type (e.g., "Solar Consultation")
3. Copy the scheduling link (e.g., `https://calendly.com/your-name/solar-consultation`)
4. Add this to your `.env.local`:
   ```
   NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-name/solar-consultation
   ```

## Step 3: Create Webhook Subscription

### Option A: Using Calendly API (Recommended)

Use this curl command to create a webhook subscription:

```bash
curl --request POST \
  --url https://api.calendly.com/webhook_subscriptions \
  --header 'Authorization: Bearer YOUR_CALENDLY_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "url": "https://testingground.sbs/api/booking/webhook",
    "events": [
      "invitee.created"
    ],
    "organization": "https://api.calendly.com/organizations/YOUR_ORG_ID",
    "user": "https://api.calendly.com/users/YOUR_USER_ID",
    "scope": "user"
  }'
```

**To find your Organization ID and User ID:**
```bash
# Get your user info
curl --header 'Authorization: Bearer YOUR_CALENDLY_API_KEY' \
  https://api.calendly.com/users/me

# Response will include:
# - resource.uri (your user ID)
# - resource.current_organization (your org ID)
```

### Option B: Using Calendly Zapier Integration

If you don't have API access:
1. Use Zapier to connect Calendly to Webhooks by Zapier
2. Configure trigger: "Invitee Created" in Calendly
3. Configure action: POST to `https://testingground.sbs/api/booking/webhook`
4. Map the fields according to the payload structure below

## Step 4: Test the Webhook

### Test with Sample Data

You can test your webhook endpoint directly:

```bash
curl --request POST \
  --url https://testingground.sbs/api/booking/webhook \
  --header 'Content-Type: application/json' \
  --data '{
    "event": "invitee.created",
    "payload": {
      "invitee": {
        "email": "customer@example.com",
        "name": "John Doe",
        "questions_and_answers": [
          {
            "question": "What is your preferred contact method?",
            "answer": "Email"
          }
        ]
      },
      "event": {
        "start_time": "2024-12-20T14:00:00Z",
        "end_time": "2024-12-20T15:00:00Z"
      }
    }
  }'
```

### Expected Response

Success:
```json
{
  "received": true,
  "leadId": "uuid-here",
  "statusUpdated": true
}
```

Lead not found (warning but still success):
```json
{
  "received": true,
  "warning": "No matching lead found"
}
```

## Step 5: Verify Integration

After setting up the webhook:

1. **Create a test lead:**
   - Go to your calculator: `https://testingground.sbs`
   - Fill out the form with a real email address
   - Submit the form

2. **Check email received:**
   - Verify customer email with shareable link
   - Click the shareable link

3. **Schedule appointment:**
   - Click "Schedule Consultation" button
   - Complete Calendly booking with the SAME email used in the lead

4. **Verify webhook processing:**
   - Check your server logs for webhook receipt
   - Check Supabase: lead should have `scheduled_appointment_at` and status "contacted"
   - Check installer email: should receive appointment notification

## Webhook Payload Structure

The endpoint expects this payload from Calendly:

```json
{
  "event": "invitee.created",
  "payload": {
    "invitee": {
      "email": "customer@example.com",
      "name": "Customer Name",
      "questions_and_answers": [
        {
          "question": "Any questions?",
          "answer": "Customer response"
        }
      ]
    },
    "event": {
      "start_time": "2024-12-20T14:00:00Z",
      "end_time": "2024-12-20T15:00:00Z"
    }
  }
}
```

## Environment Variables Summary

Make sure these are set in your `.env.local`:

```env
# Required
NEXT_PUBLIC_APP_URL=https://testingground.sbs
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-name/solar-consultation

# Email notifications
RESEND_API_KEY=re_your_key
INSTALLER_EMAIL=installer@testingground.sbs
EMAIL_FROM=Solar Estimate Team <noreply@testingground.sbs>
EMAIL_REPLY_TO=support@testingground.sbs

# Supabase (required for webhook to update leads)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Troubleshooting

### Webhook not firing

1. **Verify webhook is created:**
   ```bash
   curl --header 'Authorization: Bearer YOUR_CALENDLY_API_KEY' \
     https://api.calendly.com/webhook_subscriptions
   ```

2. **Check webhook URL is correct** (must be HTTPS in production)

3. **Verify event type is "invitee.created"** (not "invitee.canceled")

### Lead not updating

1. **Check email match:** The booking email MUST match the lead's contact email
2. **Check Supabase RLS:** Service role key bypasses RLS, but verify policies if issues persist
3. **Check server logs:** Look for error messages in webhook processing

### No installer email

1. **Verify INSTALLER_EMAIL env var is set**
2. **Check Resend API key is valid**
3. **Check server logs for email send errors**
4. **Verify email template renders correctly**

## Security Considerations

### Webhook Signature Verification (Future Enhancement)

For production, add signature verification:

```typescript
// In webhook route
const signature = req.headers.get('calendly-webhook-signature');
const isValid = verifyCalendlySignature(payload, signature);

if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

Calendly provides HMAC signatures - see their docs for implementation details.

### Rate Limiting

Consider adding rate limiting to prevent abuse:
- Max 100 webhook calls per minute
- Block repeated identical payloads within 1 minute

## Support

If you encounter issues:
1. Check server logs: `vercel logs` or your hosting provider's log viewer
2. Check Calendly webhook delivery logs in Calendly dashboard
3. Review Supabase logs for database errors
4. Test email delivery via Resend dashboard

## Next Steps

After webhook is working:
- [ ] Add calendar integration (Google Calendar, Outlook)
- [ ] Send reminder emails before appointments
- [ ] Add appointment rescheduling support
- [ ] Track appointment outcomes in dashboard
