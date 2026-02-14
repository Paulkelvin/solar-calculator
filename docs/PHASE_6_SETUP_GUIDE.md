# Phase 6.1 Implementation Guide: Setup & Testing

## Current Status
- ✅ Auth context created and wired up
- ✅ Login/Signup pages exist with validation
- ✅ Auth service methods implemented (signUp, signIn, signOut, getSession, etc.)
- ✅ Installer types defined with Zod schemas
- ✅ Dashboard layout with protection created
- ✅ Build passes with 0 errors
- ❌ Supabase database not configured
- ❌ Auth flow not tested end-to-end

## Prerequisites

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Sign up or login
3. Create a new project
4. Name: "solar-calculator" (or similar)
5. Region: Choose closest to your location
6. Password: Save securely
7. Wait for project to initialize (~2 minutes)

### 2. Get Supabase Credentials
1. Go to Project Settings → API
2. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add to `.env.local`:
   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 3. Setup Auth in Supabase
1. Go to Authentication → Providers
2. Enable Email/Password provider
3. Go to Authentication → Policies
4. Under Email Auth, set:
   - Confirm email: OFF (for testing)
   - Auto-confirm users: ON
5. Go to Authentication → User Management
6. Confirm "Email" is set as email field

### 4. Create Database Schema

#### SQL to run in Supabase SQL Editor:

```sql
-- Installers table
CREATE TABLE installers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  website TEXT,
  state TEXT DEFAULT 'CA',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Update leads table to add installer_id
ALTER TABLE leads ADD COLUMN installer_id UUID REFERENCES installers(id) ON DELETE CASCADE;
CREATE INDEX idx_leads_installer_id ON leads(installer_id);

-- RLS Policies for installers table
ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON installers
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON installers
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow installers to view only their own leads
CREATE POLICY "Installers can view own leads" ON leads
  FOR SELECT USING (auth.uid() = installer_id);

-- Allow installers to create leads
CREATE POLICY "Installers can create leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = installer_id);

-- Allow installers to update their own leads
CREATE POLICY "Installers can update own leads" ON leads
  FOR UPDATE USING (auth.uid() = installer_id)
  WITH CHECK (auth.uid() = installer_id);

-- Allow installers to delete their own leads
CREATE POLICY "Installers can delete own leads" ON leads
  FOR DELETE USING (auth.uid() = installer_id);
```

### 5. Update .env.local

```dotenv
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google APIs (already configured)
NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY=AIzaSyAWBEzxj6-AUJgIr9ODT1ZoPvuaDOjnaPc
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyAWBEzxj6-AUJgIr9ODT1ZoPvuaDOjnaPc
```

### 6. Restart Dev Server
```bash
npm run dev
```

## Testing Phase 6.1

### Step 1: Test Signup Flow
1. Open http://localhost:3000/auth/signup
2. Fill in:
   - Company Name: "Test Solar Co"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Sign Up"
4. Should redirect to login page with message "You can now sign in"

### Step 2: Verify Installer Profile Created
1. Go to Supabase dashboard
2. Navigate to "installers" table
3. Should see new row with:
   - id: User's UUID
   - email: test@example.com
   - company_name: Test Solar Co

### Step 3: Test Login Flow
1. Open http://localhost:3000/auth/login
2. Enter:
   - Email: test@example.com
   - Password: password123
3. Click "Sign In"
4. Should redirect to /dashboard

### Step 4: Verify Dashboard Protection
1. Try to access http://localhost:3000/dashboard while logged out
2. Should redirect to /auth/login
3. Login again
4. Should see dashboard with navigation

### Step 5: Test Lead Creation (With Auth)
1. On dashboard, click "Calculator" link
2. Fill in calculator form
3. At the end, leads should be created with `installer_id` = current user's ID
4. Go back to dashboard
5. Should see the new lead in the leads list

### Step 6: Verify Lead Scoping
1. Create another account:
   - Company: "Different Solar"
   - Email: test2@example.com
   - Password: password123
2. Submit a lead from that account
3. Login as test@example.com
4. Dashboard should only show leads from test@example.com (not from test2)
5. This verifies RLS is working

### Step 7: Test Logout
1. Click "Sign Out" button
2. Should redirect to login page
3. Try to access /dashboard
4. Should redirect to login

## Troubleshooting

### "Failed to create installer profile"
- Check that installers table exists
- Check auth user was created (should see in Supabase > Auth)
- Verify RLS policies don't block INSERT

### Leads not showing on dashboard
- Check that leads table has installer_id column
- Verify auth user ID is set as installer_id when creating leads
- Check RLS policy on leads table

### Dashboard keeps redirecting to login
- Check .env.local has correct SUPABASE_URL and ANON_KEY
- Check browser console for errors
- Try clearing browser cache

### Can see other installer's leads
- RLS policy might not be working
- Check RLS is enabled on leads table
- Verify policy uses `auth.uid() = installer_id`

## Next Steps After Phase 6.1

Once signup/login/dashboard works:
1. **Phase 6.2:** Lead management UI (edit, delete, export)
2. **Phase 6.3:** Lead scoring integration
3. **Phase 6.4:** Multi-user teams
4. **Phase 6.5:** Notification system

