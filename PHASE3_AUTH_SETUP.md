# Phase 3.1 - Admin Authentication & RLS Setup

## Overview
This document describes the multi-tenant authentication system and Row-Level Security (RLS) policies implemented in Phase 3.

## What's New

### Authentication System
- **Supabase Auth** (email/password) for installer login
- **Auth Context** for client-side session management
- **Route Protection** via Next.js middleware
- **Auth Pages**: Login, Sign Up, Reset Password

### Database Changes
- Added `user_id` foreign key to `installers` table
- Implemented RLS policies for all tables
- Multi-tenant data isolation by `installer_id`

## Setup Instructions

### 1. Update Database Schema

Run the following SQL in Supabase dashboard (SQL Editor):

```sql
-- Add user_id column to installers if not exists
ALTER TABLE public.installers 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_installers_user_id ON public.installers(user_id);
CREATE INDEX idx_leads_installer_id ON public.leads(installer_id);
```

### 2. Enable RLS Policies

Copy and run all SQL from `PHASE3_RLS_POLICIES.sql` in Supabase SQL Editor.

This will:
- Enable RLS on all tables
- Create policies for installers to view their own data
- Allow public access to utility rates & incentives
- Ensure service role (backend) can still create records

### 3. Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Test Authentication Flow

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/auth/signup
3. Create new installer account
4. Sign in to http://localhost:3000/dashboard
5. Verify RLS by checking that only own leads are visible

## Architecture

### Auth Flow

```
User → Sign Up/Login → Supabase Auth
    ↓
    Create/Update Installer Profile
    ↓
    Session Stored (via AuthContext)
    ↓
    Protected Routes (Middleware)
    ↓
    Dashboard (Scoped by installer_id)
```

### RLS Policies

#### Installers Table
- **SELECT**: Own profile only (`user_id = auth.uid()`)
- **UPDATE**: Own profile only
- **INSERT**: Service role only (backend)

#### Leads Table
- **SELECT**: Leads where `installer_id = current_installer_id`
- **UPDATE**: Own leads only
- **INSERT**: Service role only (allows public calculator)

#### Activity Log
- **SELECT**: Activity for own leads
- **INSERT**: Service role only

#### Utility Rates & Incentives
- **SELECT**: Public read access

## Code Structure

### New Files
- `src/lib/supabase/auth.ts` - Auth utilities (signUp, signIn, signOut, etc.)
- `src/contexts/auth.tsx` - React Context for session state
- `src/app/auth/login/page.tsx` - Login page
- `src/app/auth/signup/page.tsx` - Sign up page
- `src/app/auth/reset-password/page.tsx` - Password reset page
- `types/auth.ts` - Auth types & schemas (Zod validation)
- `middleware.ts` - Route protection

### Updated Files
- `src/app/layout.tsx` - Wrapped with AuthProvider

## Multi-Tenant Scoping

### For Dashboard
```typescript
// leads are automatically filtered by RLS
const { data: leads } = await supabase
  .from('leads')
  .select('*')
  .order('created_at', { ascending: false });
// Only returns leads where installer_id matches current user's installer profile
```

### For Calculator
- Public calculator pages remain accessible
- On lead submission, `installer_id` defaults to `DEFAULT_INSTALLER_ID` (Phase 1 fallback)
- After authentication rollout, can update to use current installer's ID

## Testing Checklist

- [ ] Sign up creates installer profile
- [ ] Login redirects to dashboard
- [ ] Dashboard shows only own leads
- [ ] Two installers see different leads
- [ ] Sign out clears session
- [ ] Password reset email sends
- [ ] Protected routes redirect to login when unauthenticated

## Phase 3.2 - Next Steps

After auth is tested and working:
1. Integrate Resend for email notifications
2. Send emails on lead submission
3. Add email address verification
4. Expand to OAuth (Google, etc.)

## Troubleshooting

### Middleware not protecting routes
- Ensure `middleware.ts` is in root directory
- Clear `.next` cache: `rm -rf .next`
- Rebuild: `npm run build`

### RLS returning empty results
- Check that `installer_id` column exists
- Verify RLS policies are created
- Test with `curl` to isolate frontend vs backend issue

### Session not persisting
- Check browser cookies for `sb-*` tokens
- Verify `AuthProvider` wraps entire app in layout

## Security Notes

- All user data is scoped by `installer_id` via RLS
- Service role (backend) can bypass RLS (used for admin operations)
- Passwords are hashed by Supabase (bcrypt)
- Sessions expire after inactivity (Supabase default: 1 hour)
- HTTPS required for production (Supabase enforces)

---

**Status**: Phase 3.1 Complete ✅  
**Last Updated**: 2026-01-28  
**Next**: Phase 3.2 - Email Notifications
