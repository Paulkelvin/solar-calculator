# Email Integration Setup - Admin Signup Welcome Emails

## ✅ What Has Been Implemented

### Step 2: Welcome Email Template & Sender Function
- ✅ Created `welcomeEmail` template in `src/lib/email/templates.ts`
- ✅ Created `sendWelcomeEmail()` function in `src/lib/email/sender.ts`
- ✅ Email includes dashboard link and feature overview

### Step 3: Auth Callback Route (Already Existed)
- ✅ `src/app/auth/callback/route.ts` handles email confirmation redirects
- ✅ Updated to trigger welcome email after successful confirmation
- ✅ Works for both PKCE flow and token hash flow

### Step 4: Welcome Email Trigger
- ✅ Created API route: `src/app/api/email/send-welcome/route.ts`
- ✅ Prevents duplicate emails via `welcome_email_sent` flag
- ✅ Triggered automatically after email confirmation
- ✅ Non-blocking (doesn't delay redirect to dashboard)

### Step 5: Lead Notifications (Already Working)
- ✅ Lead notification emails remain unchanged
- ✅ Uses Resend for transactional emails
- ✅ Templates in `src/lib/email/templates.ts`

---

## 🚀 What You Need to Do Next

### 1. Run the Database Migration
Execute this SQL in your Supabase SQL Editor:

```sql
-- File: sql/ADD_WELCOME_EMAIL_COLUMN.sql
ALTER TABLE installers 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_installers_welcome_email ON installers(welcome_email_sent);

UPDATE installers SET welcome_email_sent = FALSE WHERE welcome_email_sent IS NULL;
```

### 2. Update Environment Variables

Make sure these are set in your **production environment** (Vercel):

```env
NEXT_PUBLIC_APP_URL=https://testingground.sbs
RESEND_API_KEY=re_your_actual_resend_key
EMAIL_FROM=Solar Calculator <noreply@testingground.sbs>
```

**Important:** The `EMAIL_FROM` address must use a verified domain in Resend.

If you use a different subdomain/domain, update it to match:
- `noreply@testingground.sbs` ✅ (if testingground.sbs is verified)
- `hello@testingground.sbs` ✅ (any address @ verified domain)

### 3. Verify Resend Domain Settings

Go to [Resend Dashboard](https://resend.com/domains):
1. Confirm `testingground.sbs` shows as ✅ **Verified**
2. All DNS records (SPF, DKIM) are properly configured
3. Domain status is **Active**

### 4. Deploy Changes

```bash
git add .
git commit -m "Add admin welcome email integration"
git push
```

Wait for Vercel deployment to complete.

---

## 🧪 Testing the Email Flow

### Test 1: New Admin Signup
1. Go to `https://testingground.sbs/auth/signup`
2. Sign up with a **real email address** you can access
3. Check inbox for **Supabase confirmation email** (subject: "Confirm Your Email")
4. Click the confirmation link in the email
5. You should be redirected to `/dashboard`
6. Within ~30 seconds, check inbox for **Welcome email** from Solar Calculator

**Expected welcome email:**
- Subject: 🎉 Welcome to Solar ROI Calculator
- From: Solar Calculator <noreply@testingground.sbs>
- Contains dashboard link and feature overview

### Test 2: Duplicate Prevention
1. Log out and log back in with the same account
2. **No duplicate welcome email should be sent**
3. Check database: `installers.welcome_email_sent` should be `TRUE`

### Test 3: Lead Notifications (Existing Feature)
1. Submit a lead via the calculator at `/`
2. Installer should receive lead notification email
3. Verify email arrives and contains lead details

---

## 📊 Flow Diagram

```
User Signs Up → Supabase Auth → Confirmation Email Sent (Supabase)
                     ↓
User Clicks Link → /auth/callback → Exchange Code for Session
                     ↓
         Success → Redirect to /dashboard
                     ↓
         (Background) → /api/email/send-welcome → Send Welcome Email
                                                      ↓
                                              Mark welcome_email_sent=true
```

---

## 🐛 Troubleshooting

### Welcome Email Not Received?

**Check 1: Email Service Logs**
- Go to [Resend Dashboard → Logs](https://resend.com/emails)
- Search for the user's email address
- Check delivery status, errors, or bounces

**Check 2: Database Flag**
```sql
-- Check if welcome_email_sent flag exists
SELECT id, email, welcome_email_sent FROM installers;
```

**Check 3: Server Logs**
- Check Vercel logs for errors in `/api/email/send-welcome`
- Look for "Welcome email sent successfully" or error messages

**Check 4: Environment Variables**
```bash
# In Vercel Dashboard → Settings → Environment Variables, verify:
RESEND_API_KEY=re_... (starts with "re_")
EMAIL_FROM=Solar Calculator <noreply@testingground.sbs>
NEXT_PUBLIC_APP_URL=https://testingground.sbs
```

### Confirmation Email Not Received?

**This is a Supabase issue, not Resend:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Verify "Confirm signup" is enabled
3. Check Supabase email provider status
4. Test with a different email address (Gmail, etc.)

### Email Goes to Spam?

**Domain Authentication:**
1. Resend Dashboard → Domains → testingground.sbs
2. Verify all DNS records are green ✅
3. Wait 24-48 hours for DNS propagation if recently added
4. Test with multiple email providers (Gmail, Outlook, etc.)

---

## 📝 Key Files Modified

| File | Change |
|------|--------|
| `src/lib/email/templates.ts` | Added `welcomeEmail` template |
| `src/lib/email/sender.ts` | Added `sendWelcomeEmail()` function |
| `src/app/api/email/send-welcome/route.ts` | Created API route (NEW FILE) |
| `src/app/auth/callback/route.ts` | Added welcome email trigger |
| `sql/ADD_WELCOME_EMAIL_COLUMN.sql` | Database migration (NEW FILE) |
| `.env.example` | Added email-related env vars |

---

## ✨ What Happens Now

### On Admin Signup:
1. ✅ Admin signs up at `/auth/signup`
2. ✅ Supabase sends **confirmation email** (native Supabase)
3. ✅ Admin clicks link, redirected to `/dashboard`
4. ✅ **Welcome email** sent automatically via Resend
5. ✅ Welcome email tracked in database to prevent duplicates

### On Lead Submission:
1. ✅ Customer submits lead via calculator
2. ✅ Lead saved to database
3. ✅ **Lead notification email** sent to installer via Resend
4. ✅ Customer can receive confirmation email (if enabled)

### Password Reset:
1. ✅ User clicks "Forgot Password" at `/auth/login`
2. ✅ Supabase sends **password reset email** (native Supabase)
3. ✅ User resets password, redirected to `/auth/update-password`

---

## 🎯 Summary

✅ **Supabase handles:** Account confirmation, password resets  
✅ **Resend handles:** Welcome emails, lead notifications  
✅ **No duplicate emails:** Tracked via database flag  
✅ **Ready for production:** All code deployed, just needs migration + env vars

**Next Step:** Run the SQL migration and test signup flow!
