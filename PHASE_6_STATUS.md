# Phase 6.1 Status: Existing Infrastructure Audit

## ✅ Already Implemented

### Auth Infrastructure
- ✅ `src/contexts/auth.tsx` - Auth context with session management
- ✅ `types/auth.ts` - AuthUser, InstallerProfile, SignUpInput, LoginInput schemas with Zod validation
- ✅ `useAuth()` hook - Easy access to auth context
- ✅ `src/lib/supabase/auth.ts` - Supabase client initialization (exists but location needs verification)

### Auth Pages
- ✅ `src/app/auth/login/page.tsx` - Login page
- ✅ `src/app/auth/signup/page.tsx` - Sign up page  
- ✅ `src/app/auth/reset-password/page.tsx` - Password reset page
- ✅ `src/app/auth/layout.tsx` - Auth layout (implied by pages)

### Dashboard Infrastructure
- ✅ `src/app/dashboard/page.tsx` - Dashboard main page
- ✅ `src/components/dashboard/LeadsList.tsx` - Leads list component with sorting
- ✅ `types/leads.ts` - Lead interface WITH installer_id field

### Type System
- ✅ Lead interface includes `installer_id`
- ✅ LoginSchema & SignUpSchema with validation
- ✅ AuthSession interface

## ❌ What's Missing / Needs Work

### Critical Database Setup
1. **installers table** - Needs to be created in Supabase
2. **RLS policies** - Installers table and leads table need row-level security
3. **installer_id foreign key** - Needs to be added to leads table (or already exists - needs verification)

### Auth Service Methods
1. **signUp()** - Create auth user + installer profile
2. **login()** - Authenticate and fetch installer profile
3. **logout()** - Sign out user
4. **getSession()** - Fetch current session
5. **onAuthStateChange()** - Listen for auth changes

Currently these might be stubbed or incomplete. Need to verify in `src/lib/supabase/auth.ts` and surrounding auth service files.

### Integration Points
1. **Dashboard Protection** - Dashboard layout needs to check authentication
2. **Lead Creation** - CalculatorWizard needs to capture installer_id from auth context
3. **Lead Querying** - fetchLeads() needs to filter by current installer_id (RLS should enforce)

### Configuration
1. **Supabase environment variables** - Ensure .env.local has:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_APP_URL (for email redirects)

## 🔧 Implementation Plan

### Phase 6.1a: Database Setup (Done in Supabase Console)
1. Create installers table schema
2. Add RLS policies to installers
3. Add installer_id to leads (or verify it exists)
4. Add RLS policies to leads for per-installer scoping

### Phase 6.1b: Auth Service Implementation (Code)
1. Implement/verify signUp, login, logout, getSession, onAuthStateChange
2. Handle installer profile creation/fetching
3. Add error handling

### Phase 6.1c: Dashboard Protection (Code)
1. Create dashboard layout with ProtectedRoute
2. Add auth check redirect
3. Update LeadsList to use authenticated installer

### Phase 6.1d: Lead Creation Integration (Code)
1. Update CalculatorWizard to get installer from useAuth()
2. Pass installer_id when creating lead
3. Add installer_id to lead creation payload

### Phase 6.1e: Testing
1. Manual test signup flow
2. Manual test login flow
3. Manual test lead creation while authenticated
4. Verify dashboard shows correct leads per installer
5. Verify RLS prevents accessing other installers' leads

## Next Action

Since infrastructure exists but might be incomplete:
1. First verify Supabase connection is working
2. Check if installers table exists
3. Check if RLS policies exist
4. Then complete auth service methods
5. Finally integrate into calculator and dashboard

**Recommendation:** Start by checking Supabase status and database schema first.
