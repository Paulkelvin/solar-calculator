# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for your Solar ROI Calculator app.

## Overview

Google OAuth allows users to sign in using their Google accounts, providing a convenient and secure authentication method.

## Prerequisites

- Supabase project (already configured)
- Google Cloud Console account
- Production URL: `https://testingground.sbs`
- Supabase callback URL: `https://epooqasmhxxrpjhizhez.supabase.co/auth/v1/callback`

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project details:
   - **Project name:** Solar ROI Calculator (or your preferred name)
   - **Organization:** (leave default or select your org)
4. Click **"Create"**

---

## Step 2: Enable Google+ API

1. In your Google Cloud project, go to **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **"Create"**
4. Fill in the required fields:

### App Information:
- **App name:** Solar ROI Calculator
- **User support email:** Your email address
- **App logo:** (optional) Upload your app logo

### App Domain:
- **Application home page:** `https://testingground.sbs`
- **Application privacy policy link:** `https://testingground.sbs/privacy` (create this page)
- **Application terms of service link:** `https://testingground.sbs/terms` (create this page)

### Authorized Domains:
- Add: `testingground.sbs`
- Add: `supabase.co`

### Developer Contact Information:
- **Email addresses:** Your email address

5. Click **"Save and Continue"**

### Scopes:
6. On the Scopes page, click **"Add or Remove Scopes"**
7. Select these scopes:
   - `email`
   - `profile`
   - `openid`
8. Click **"Update"** → **"Save and Continue"**

### Test Users (optional for development):
9. Add test users if you want to test before publishing
10. Click **"Save and Continue"**

---

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Configure:
   - **Application type:** Web application
   - **Name:** Solar ROI Calculator Web Client

### Authorized JavaScript Origins:
Add these URLs:
```
https://testingground.sbs
http://localhost:3000
```

### Authorized Redirect URIs:
Add this URL (from Supabase):
```
https://epooqasmhxxrpjhizhez.supabase.co/auth/v1/callback
```

4. Click **"Create"**
5. **Copy the Client ID and Client Secret** - you'll need these for Supabase

---

## Step 5: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand
5. Enable Google provider and configure:

### Settings:
- **Enable Google provider:** Toggle ON
- **Client ID:** Paste the Client ID from Google Cloud Console
- **Client Secret:** Paste the Client Secret from Google Cloud Console

### Optional Settings:

#### Skip nonce checks:
- **Leave UNCHECKED** for maximum security
- Only enable if you have iOS-specific issues with Apple's Sign in with Apple feature

**Why unchecked?** 
- Nonce checks prevent replay attacks
- Provides better security
- Only needed in specific edge cases (iOS native apps without nonce access)

#### Allow users without an email:
- **Leave UNCHECKED** 
- Your app requires email addresses for sending quotes and notifications

**Why unchecked?**
- Your app sends customer emails and installer notifications
- Email is required for core functionality
- All Google accounts have email addresses anyway

6. Click **"Save"**

---

## Step 6: Test the Integration

### Local Testing:
1. Run your app locally: `npm run dev`
2. Go to `http://localhost:3000/auth/login`
3. Click **"Continue with Google"**
4. Sign in with your Google account
5. Verify redirect to dashboard works

### Production Testing:
1. Deploy your changes to production
2. Go to `https://testingground.sbs/auth/login`
3. Click **"Continue with Google"**
4. Sign in with your Google account
5. Verify:
   - ✅ Redirects to dashboard
   - ✅ User profile shows in top-right
   - ✅ Installer profile created in database

---

## Understanding the Callback URL

**Callback URL:** `https://epooqasmhxxrpjhizhez.supabase.co/auth/v1/callback`

### What it does:
1. User clicks "Sign in with Google"
2. App redirects to Google's OAuth page
3. User authenticates with Google
4. Google redirects to this Supabase callback URL
5. Supabase validates the OAuth token
6. Supabase redirects to your app's callback handler: `/auth/callback`
7. Your app creates session and redirects to dashboard

### Security:
- This URL is handled entirely by Supabase
- It validates the OAuth response from Google
- It creates the authentication session
- It's completely separate from your app's callback handler

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution:** Make sure the callback URL in Google Cloud Console exactly matches:
```
https://epooqasmhxxrpjhizhez.supabase.co/auth/v1/callback
```

### Error: "Access blocked: This app's request is invalid"
**Solution:** 
- Check that Google+ API is enabled
- Verify OAuth consent screen is configured
- Ensure authorized domains include `testingground.sbs` and `supabase.co`

### Users not being created in installers table
**Solution:** 
- Check that the `/auth/callback` route creates installer profile for OAuth users
- For Google OAuth, user metadata might not include `name` and `company_name`
- Update callback to handle OAuth users differently

### Email not returned by Google
**Solution:** 
- This is rare - virtually all Google accounts have email
- If it happens, the "Allow users without email" setting would permit sign-in
- However, your app requires email for functionality, so keep this disabled

---

## OAuth User Profile Creation

When users sign in with Google, their profile data comes from Google:

### Google provides:
- `email` - Always provided
- `full_name` - User's full name from Google account
- `avatar_url` - Profile picture URL
- `provider_id` - Google user ID

### Handling OAuth users:
The `/auth/callback` route should detect OAuth sign-ins and create installer profiles using:
- `contact_name` from Google's `full_name`
- `company_name` can be set to a default (e.g., "[Name] Solar Co.")
- `email` from Google's email

See `src/app/auth/callback/route.ts` for implementation details.

---

## Security Best Practices

1. **Keep Client Secret secure:**
   - Never commit to git
   - Store only in Supabase dashboard
   - Rotate periodically

2. **Use HTTPS only:**
   - Production must use HTTPS
   - Never use HTTP for OAuth in production

3. **Verify email domain (optional):**
   - If you want to restrict to specific domains (e.g., `@yourcompany.com`)
   - Add server-side validation in `/auth/callback`

4. **Monitor OAuth activity:**
   - Check Supabase logs for failed attempts
   - Monitor for suspicious patterns

---

## Publishing Your OAuth App

Your OAuth consent screen starts in "Testing" mode with limited users.

### To publish for all users:

1. Go to **OAuth consent screen** in Google Cloud Console
2. Click **"Publish App"**
3. Submit for verification if needed (for sensitive scopes)
4. For basic scopes (email, profile), publishing is instant

**Note:** For production use with all users, you must publish the OAuth app.

---

## Files Modified

| File | Purpose |
|------|---------|
| `src/lib/supabase/auth.ts` | Added `signInWithGoogle()` function |
| `src/app/auth/login/page.tsx` | Added Google sign-in button |
| `src/app/auth/signup/page.tsx` | Added Google sign-up button |
| `src/app/auth/callback/route.ts` | Handle OAuth redirects |

---

## Environment Variables

No additional environment variables needed! Google OAuth is configured entirely through:
- Supabase Dashboard (stores Client ID and Secret)
- Google Cloud Console (stores redirect URIs)

---

## Summary Checklist

- [ ] Create Google Cloud project
- [ ] Enable Google+ API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth credentials (Client ID & Secret)
- [ ] Add authorized redirect URI in Google Cloud
- [ ] Configure Google provider in Supabase
- [ ] Test locally
- [ ] Deploy to production
- [ ] Test in production
- [ ] Publish OAuth app (for public access)

---

**Setup Time:** ~15-20 minutes  
**Status:** Ready to implement  
**Documentation Date:** January 2025
