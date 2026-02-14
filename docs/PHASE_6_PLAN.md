# Phase 6: Multi-Tenant Installer Platform

## Phase 6.1: Installer Authentication & Lead Management

### Goals
- ✅ Implement Supabase authentication for installers
- ✅ Create installer profiles with company info
- ✅ Enable per-installer lead scoping via RLS
- ✅ Build authenticated dashboard with lead list
- ✅ Implement lead persistence and retrieval
- ✅ Add lead detail/editing views

### Technical Architecture

#### Database Schema (Supabase)

**1. `auth.users` (Supabase built-in)**
- Email, password, created_at, last_sign_in_at

**2. `installers` (NEW)**
```sql
CREATE TABLE installers (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  state TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**3. `leads` (UPDATED)**
```sql
-- Add installer_id to existing leads table
ALTER TABLE leads ADD COLUMN installer_id UUID REFERENCES installers(id) ON DELETE CASCADE;
CREATE INDEX idx_leads_installer_id ON leads(installer_id);
```

#### RLS Policies

**Installers table:**
- SELECT: Own profile only
- UPDATE: Own profile only
- INSERT: During signup (disabled after)

**Leads table:**
- SELECT: Own leads only
- CREATE: Any (during calculator submission)
- UPDATE: Own leads only
- DELETE: Own leads only

### Implementation Steps

#### Step 1: Update Supabase Schema
- Create `installers` table with RLS
- Add `installer_id` to `leads` table
- Create indexes and constraints

#### Step 2: Create Auth Context
Files to create:
- `src/lib/auth/auth-context.tsx` - React Context
- `src/lib/auth/use-auth.ts` - Hook for easy access
- `src/lib/auth/auth-types.ts` - TypeScript interfaces

#### Step 3: Build Auth Pages
Files to create:
- `src/app/auth/login/page.tsx` - Email/password login
- `src/app/auth/signup/page.tsx` - Installer registration
- `src/app/auth/layout.tsx` - Auth layout (no nav)

#### Step 4: Implement Auth Service
Files to create:
- `src/lib/supabase/auth-service.ts` - Sign up, login, logout, session
- `src/lib/supabase/installer-service.ts` - Profile CRUD

#### Step 5: Add Protected Routes
Files to modify:
- `src/app/dashboard/layout.tsx` - Check auth, redirect if needed
- `src/app/layout.tsx` - Add auth provider wrapper

#### Step 6: Update Lead Submission
Files to modify:
- `src/components/calculator/CalculatorWizard.tsx` - Pass installer_id to leads
- `src/lib/supabase/queries.ts` - Include installer_id in lead creation

#### Step 7: Enhance Dashboard
Files to modify:
- `src/app/dashboard/page.tsx` - Show authenticated installer's leads only

### Data Flow

**Signup:**
1. Installer fills form (email, password, company info)
2. `auth-service.signUp()` creates user in auth.users
3. `installer-service.createProfile()` creates row in installers table
4. Auth context updates
5. Redirect to dashboard

**Login:**
1. Installer enters email/password
2. `auth-service.login()` authenticates with Supabase
3. Auth context loads user + installer profile
4. Redirect to dashboard

**Lead Submission:**
1. Potential customer fills calculator
2. `CalculatorWizard` gets current installer from auth context
3. Lead saved with `installer_id = currentUser.id`
4. RLS ensures only that installer can see it

**Lead Management:**
1. Dashboard queries only user's leads (RLS enforced)
2. Each installer sees only their leads
3. Can view, edit, export lead details
4. Lead score, system design options shown

### Phase 6.1 Success Criteria
- ✅ Supabase Auth configuration complete
- ✅ Installer table with RLS policies
- ✅ Auth context functional
- ✅ Login/Signup pages working
- ✅ Dashboard shows authenticated installer's leads
- ✅ Lead submission captures installer_id
- ✅ All tests passing (existing + new auth tests)
- ✅ Committed to GitHub

### Testing Strategy
- Unit tests for auth service
- Unit tests for installer service
- Integration tests for login/signup flow
- E2E test for lead submission with auth

### Files to Create (Phase 6.1)
```
src/lib/auth/
  ├── auth-context.tsx (150 lines)
  ├── use-auth.ts (30 lines)
  ├── auth-types.ts (40 lines)
  └── auth-utils.ts (50 lines)

src/lib/supabase/
  ├── auth-service.ts (120 lines)
  └── installer-service.ts (80 lines)

src/app/auth/
  ├── layout.tsx (40 lines)
  ├── login/page.tsx (120 lines)
  └── signup/page.tsx (150 lines)

src/components/auth/
  ├── AuthForm.tsx (100 lines)
  └── ProtectedRoute.tsx (30 lines)

tests/
  └── phase6-auth.test.ts (150 lines)
```

### Files to Modify (Phase 6.1)
- `src/app/layout.tsx` - Add AuthProvider wrapper
- `src/app/dashboard/layout.tsx` - Add ProtectedRoute
- `src/components/calculator/CalculatorWizard.tsx` - Pass installer_id
- `src/lib/supabase/queries.ts` - Include installer_id in leads
- `types/leads.ts` - Add installer_id to Lead interface
- `.env.local` - Add Supabase Auth URL (if needed)

### Rollout Order
1. Database schema updates (Supabase console)
2. Auth service + types
3. Auth context + hooks
4. Auth pages (login/signup)
5. Update CalculatorWizard for installer_id
6. Update dashboard for auth check
7. Tests
8. Commit & push

---

## Phase 6.2-6.5 (Future)
- Lead management (edit, scoring, assignment)
- Team/multi-user support
- Notification system
- API integrations (email, CRM, financing)
- Advanced analytics
