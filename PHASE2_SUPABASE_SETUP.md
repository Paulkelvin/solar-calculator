# Phase 2: Supabase Integration Setup

## Quick Start

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project (free tier works)
- Note your **Project URL** and **Anon Key** (found in Settings > API)

### 2. Create Database Schema
- Go to **SQL Editor** in your Supabase dashboard
- Copy the entire content from `SUPABASE_SCHEMA.sql` in this repo
- Paste and run it to create all tables

### 3. Update `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Test the Integration
- Run `npm run dev`
- Visit http://localhost:3000
- Fill out the calculator form
- Submit and check **Supabase Dashboard > Table Editor > leads** to see the data!

---

## Architecture

### Tables Created

1. **installers** - Installer profiles (Phase 2+)
   - id, name, email, company, settings

2. **leads** - Solar leads from calculator
   - installer_id (FK)
   - address, usage, roof, preferences, contact (all JSONB)
   - system_size_kw, estimated_annual_production
   - lead_score, status

3. **utility_rates** - Utility rates by state (future use)
   - state, utility_name, rate_per_kwh

4. **incentives** - Solar incentives database (future use)
   - state, name, value, type

5. **activity_log** - User action audit trail
   - lead_id, installer_id (FKs)
   - event_type, metadata

### Default Installer
```
id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
name: "Phase 1/2 Demo"
```
All leads created in Phase 2 are assigned to this installer.

---

## RLS (Row Level Security) - Phase 2

Currently set to **public read/write** for development.

**Phase 3+**: Will restrict to installer-specific data once auth is implemented.

---

## API Queries Enabled

Once you add env vars, the app will automatically:
- ✅ Save leads to `leads` table
- ✅ Log activities to `activity_log` table
- ✅ Fetch leads on dashboard
- ✅ Track results_viewed, form_submitted events

No code changes needed—the stubbed queries in `src/lib/supabase/queries.ts` will work!

---

## Troubleshooting

**Error: "supabaseUrl is required"**
- Ensure `.env.local` has both env vars set
- Restart dev server after updating env

**Error: "relation does not exist"**
- Confirm schema was created in Supabase
- Check Table Editor shows all 5 tables

**Leads not saving**
- Check browser console for errors
- Check Supabase > Activity Monitor for request logs
- Ensure RLS policies are correct

---

## What's Next

1. ✅ Supabase schema created
2. ✅ Env vars configured
3. ⏳ **Google Places API** (address autocomplete)
4. ⏳ **PDF Generation** (Puppeteer + Vercel Blob)
5. ⏳ **Email Notifications** (SendGrid/Resend)
