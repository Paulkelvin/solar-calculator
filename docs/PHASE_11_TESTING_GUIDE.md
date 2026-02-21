# Phase 11 Testing Guide

## Quick Verification Checklist

### Part 1: Verify 0 Metrics Fix (Immediate Testing)

This fix is **live now** and requires no additional setup.

#### Test Scenario 1: New Leads Show Derived Metrics
1. Go to https://testingground.sbs
2. Fill out calculator form with:
   - Any address
   - **Monthly bill amount** (e.g., $150) - do NOT enter kWh
   - Complete all other fields
3. Submit form
4. Click shareable link in email or copy from database
5. **Expected:** Estimate page shows:
   - System Size: ~8.30 kW (calculated from $150/month)
   - Annual Production: ~10,800 kWh
   - Energy Coverage: ~100%
   - **NOT 0.00 kW or 0 kWh**

#### Test Scenario 2: Existing Leads with Missing Data
1. Go to Supabase SQL Editor
2. Find a lead with `system_size_kw = 0` or `NULL`:
   ```sql
   SELECT id, share_token, system_size_kw, estimated_annual_production, usage
   FROM leads
   WHERE system_size_kw IS NULL OR system_size_kw = 0
   LIMIT 1;
   ```
3. Visit `/estimate/[share_token]`
4. **Expected:** Page shows calculated values from `usage.billAmount` or `usage.monthlyKwh`

### Part 2: Booking Workflow (Requires Calendly Setup)

This requires **manual Calendly configuration** - see [CALENDLY_WEBHOOK_SETUP.md](./CALENDLY_WEBHOOK_SETUP.md)

#### Prerequisites Setup
1. Add environment variables to Vercel:
   ```env
   INSTALLER_EMAIL=your-email@testingground.sbs
   EMAIL_REPLY_TO=support@testingground.sbs
   NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-name/consultation
   ```

2. Redeploy to apply env vars (or wait for next auto-deploy)

3. Create Calendly webhook (see full guide):
   ```bash
   curl --request POST \
     --url https://api.calendly.com/webhook_subscriptions \
     --header 'Authorization: Bearer YOUR_API_KEY' \
     --header 'Content-Type: application/json' \
     --data '{
       "url": "https://testingground.sbs/api/booking/webhook",
       "events": ["invitee.created"],
       "organization": "YOUR_ORG_URI",
       "scope": "organization"
     }'
   ```

#### Test Booking Flow (After Setup)
1. **Create test lead:**
   - Go to https://testingground.sbs
   - Use **your real email** (must match booking email)
   - Complete form and submit

2. **Check shareable link email:**
   - Open email with subject "Your Solar Estimate is Ready"
   - Verify "View Your Estimate Online" link works

3. **Schedule appointment:**
   - Click "Schedule Your Free Consultation"
   - Book appointment via Calendly
   - **Use same email address as lead**

4. **Verify webhook processing:**
   - Check Vercel logs: `vercel logs --follow`
   - Look for: "Calendly webhook received"
   - Look for: "Installer notification sent"

5. **Verify database update:**
   ```sql
   SELECT 
     id,
     contact->>'email' as email,
     status,
     scheduled_appointment_at,
     appointment_notes
   FROM leads
   WHERE contact->>'email' = 'your-email@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - **Expected:**
     - `status = 'contacted'`
     - `scheduled_appointment_at` has timestamp
     - `appointment_notes` contains booking details

6. **Check installer email:**
   - Check INSTALLER_EMAIL inbox
   - Look for subject: "New Appointment Scheduled: [Customer Name]"
   - Verify:
     - Formatted appointment time
     - Customer email (reply-to should work)
     - Links to estimate and dashboard
     - Status shows "Contacted"

### Part 3: Error Handling Tests

#### Test 1: Booking with Unmatched Email
1. Create lead with `customer@example.com`
2. Book appointment with `different@example.com`
3. **Expected:**
   - Webhook returns: `{ received: true, warning: "No matching lead found" }`
   - No database update
   - No installer email sent
   - Calendly confirmation still sent to customer

#### Test 2: Invalid Webhook Payload
```bash
curl -X POST https://testingground.sbs/api/booking/webhook \
  -H "Content-Type: application/json" \
  -d '{"invalid": "payload"}'
```
**Expected:** Returns `200` with `{ received: true }` (graceful ignoring)

#### Test 3: Duplicate Bookings
1. Book appointment
2. Cancel and rebook with same email
3. **Expected:**
   - Latest booking overwrites previous
   - Status stays "contacted"
   - Notes updated with new time

## Common Issues

### Issue: Estimate still shows 0.00 kW

**Cause:** Lead has no usage data at all

**Solution:** Lead must have either:
- `usage.monthlyKwh` (number)
- `usage.billAmount` (number)

**Debug:**
```sql
SELECT id, usage FROM leads WHERE id = 'lead-id-here';
```

If `usage` is `{}` or `NULL`, the calculation cannot derive values.

### Issue: Webhook not received

**Causes:**
1. Webhook URL incorrect in Calendly
2. Webhook not created
3. Events filter wrong (must be "invitee.created")

**Debug:**
```bash
# List your webhooks
curl --header 'Authorization: Bearer YOUR_API_KEY' \
  https://api.calendly.com/webhook_subscriptions

# Check webhook deliveries in Calendly dashboard
# Settings > Webhooks > View delivery logs
```

### Issue: No installer email

**Causes:**
1. `INSTALLER_EMAIL` not set
2. `RESEND_API_KEY` invalid
3. Email template error

**Debug:**
Check Vercel logs for:
```
Failed to send installer notification: [error details]
```

Also check Resend dashboard:
https://resend.com/emails

### Issue: Database not updating

**Causes:**
1. `SUPABASE_SERVICE_ROLE_KEY` not set
2. RLS blocking (shouldn't with service key)
3. Email mismatch

**Debug:**
```typescript
// In webhook logs, look for:
"Error updating lead: [error details]"
```

## Monitoring

### Webhook Health
Monitor these in production:
- Calendly delivery success rate (check Calendly dashboard)
- Webhook response times (should be <500ms)
- Email delivery rate (check Resend dashboard)
- Database update failures (check Supabase logs)

### Key Metrics
- **Booking conversion:** Estimates viewed → Appointments scheduled
- **Email match rate:** Bookings matched to leads
- **Notification delivery:** Installer emails sent successfully

## Next Steps After Testing

Once booking flow is verified:
1. ✅ Confirm derivation fix (all estimates show real values)
2. ✅ Confirm webhook integration (bookings update leads)
3. ✅ Confirm installer notifications (emails received)
4. 📋 Monitor for 48 hours (check logs for errors)
5. 📋 Plan Phase 12 enhancements (see PHASE_11_COMPLETION.md)

## Support

If issues persist:
1. Check Vercel deployment logs
2. Check Supabase database logs
3. Check Resend email logs
4. Check Calendly webhook delivery logs
5. Review CALENDLY_WEBHOOK_SETUP.md for detailed troubleshooting
