# Phase 6.1 Quick Start: Test End-to-End

## 📋 Prerequisites
- Supabase account (free at https://supabase.com)
- ~5 minutes

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project" 
3. Enter:
   - Project name: "solar-calculator" (or any name)
   - Database password: Create strong password (save it!)
   - Region: Choose closest to you
4. Click "Create new project" and wait ~2 min

### Step 2: Get Your Credentials
1. In Supabase, go to **Project Settings** → **API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   Anon public key: eyJx...
   ```

### Step 3: Update `.env.local`
Replace these lines in `c:\Users\paulo\Documents\solar-calculator\.env.local`:
```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJx...
```
(Keep Google API keys as-is)

### Step 4: Run Database Schema
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Open file: `SUPABASE_SCHEMA.sql` (in project root)
4. Copy ALL contents
5. Paste into Supabase SQL Editor
6. Click **RUN** (or Cmd+Enter)
7. Wait for completion ✅

### Step 5: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 6: Test Signup
1. Open http://localhost:3000/auth/signup
2. Fill in:
   - Company Name: "My Solar Co"
   - Email: **your-test-email@example.com**
   - Password: **any 6+ char password**
   - Confirm: same password
3. Click "Sign Up"
4. Should redirect to login with message "You can now sign in"

### Step 7: Test Login
1. On login page, enter same email/password
2. Click "Sign In"
3. Should redirect to /dashboard
4. Should see "My Solar Co" in top left

### Step 8: Test Lead Creation
1. Click "Calculator" in nav
2. Fill out calculator form completely
3. Submit
4. Should see results page
5. Click "Download PDF Report"
6. Go back to Dashboard
7. **Should see your lead in the list!**

### Step 9: Verify Data Isolation
1. Go to http://localhost:3000/auth/login
2. Click "Sign Up" (in login page link)
3. Create NEW account:
   - Company: "Different Solar"
   - Email: **different-email@example.com**
   - Password: same as before
4. Submit lead from this account
5. Go to Dashboard (for different email)
6. **Should see ONLY the second lead**
7. Login again with FIRST email
8. **Should see ONLY the first lead**
9. ✅ RLS is working! (Other installers can't see your leads)

## 🔍 Verification Checklist

After setup, verify these in Supabase:

### Check Tables Exist
1. Go to Supabase → **SQL Editor**
2. Run this query:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
3. Should see: `activity_log`, `incentives`, `installers`, `leads`, `utility_rates`

### Check Installers Were Created
1. Go to **Table Editor**
2. Select `installers` table
3. Should see rows for each account you created

### Check Leads Were Created
1. Go to **Table Editor**
2. Select `leads` table
3. Should see rows for leads you submitted
4. Each row should have `installer_id` filled in

### Check RLS Policies Exist
1. Go to **SQL Editor**
2. Run:
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE tablename IN ('installers', 'leads', 'activity_log') 
   ORDER BY tablename, policyname;
   ```
3. Should see policies like:
   - "Installers can view own leads"
   - "Users can view own profile"
   - etc.

## ✅ Success Indicators

- ✅ Signup works → installer profile created
- ✅ Login works → dashboard shows correct company name
- ✅ Lead submission works → lead appears in dashboard
- ✅ Only see your own leads (RLS working)
- ✅ PDF download works
- ✅ Each lead has an installer_id

## 🐛 Troubleshooting

### "Auth failed" or "Session not found"
- Check `.env.local` has correct SUPABASE_URL and ANON_KEY
- Check SUPABASE_URL uses `https://` (not http)
- Restart `npm run dev`

### "Failed to create lead" 
- Check `leads` table exists in Supabase
- Check `leads` table has `installer_id` column
- Check no RLS policies are blocking INSERTs

### Leads not showing on dashboard
- Check lead was actually created (check Supabase Table Editor)
- Check `installer_id` in lead matches your user ID
- Refresh page or clear browser cache

### See other installer's leads
- RLS policy might not be applied
- Go to Supabase → SQL Editor → run verification query above
- Verify policies show "PERMISSIVE" not "RESTRICTIVE"

### Still have issues?
- Check browser console (F12) for error messages
- Check Supabase Logs (Dashboard → Logs)
- Restart dev server: Ctrl+C, then `npm run dev`

## 📚 Next Steps

Once testing works:
1. **Phase 6.2:** Lead management (edit, delete, export)
2. **Phase 6.3:** Team management
3. **Phase 6.4:** Notifications
4. **Phase 6.5:** Integrations

---

**You're all set! 🎉**

All code is ready, all tests passing, database schema provided. Just need Supabase setup and you'll have a fully functional multi-tenant installer platform!
