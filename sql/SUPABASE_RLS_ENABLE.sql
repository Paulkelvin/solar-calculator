-- Enable Row Level Security (RLS) on all tables
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INSTALLERS TABLE POLICIES
-- ============================================================

-- Installers can read their own profile
CREATE POLICY "Installers can view own profile"
  ON installers FOR SELECT
  USING (auth.uid() = id);

-- Installers can update their own profile
CREATE POLICY "Installers can update own profile"
  ON installers FOR UPDATE
  USING (auth.uid() = id);

-- New installers can be created (handled by auth.signUp)
CREATE POLICY "Enable insert for authenticated users only"
  ON installers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- LEADS TABLE POLICIES
-- ============================================================

-- Installers can view only their own leads
CREATE POLICY "Installers can view own leads"
  ON leads FOR SELECT
  USING (installer_id = auth.uid());

-- Installers can create leads for themselves
CREATE POLICY "Installers can create own leads"
  ON leads FOR INSERT
  WITH CHECK (installer_id = auth.uid());

-- Installers can update their own leads
CREATE POLICY "Installers can update own leads"
  ON leads FOR UPDATE
  USING (installer_id = auth.uid());

-- Installers can delete their own leads
CREATE POLICY "Installers can delete own leads"
  ON leads FOR DELETE
  USING (installer_id = auth.uid());

-- PUBLIC ACCESS: Allow anonymous lead creation for calculator
-- This enables the public calculator to save leads without auth
CREATE POLICY "Allow anonymous lead creation"
  ON leads FOR INSERT
  WITH CHECK (
    installer_id IS NULL OR 
    installer_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- ============================================================
-- INCENTIVES TABLE POLICIES
-- ============================================================

-- Everyone can read incentives (public reference data)
CREATE POLICY "Anyone can view incentives"
  ON incentives FOR SELECT
  TO public
  USING (true);

-- Only authenticated installers can create/update incentives
CREATE POLICY "Only auth users can modify incentives"
  ON incentives FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- UTILITY_RATES TABLE POLICIES
-- ============================================================

-- Everyone can read utility rates (public reference data)
CREATE POLICY "Anyone can view utility rates"
  ON utility_rates FOR SELECT
  TO public
  USING (true);

-- Only authenticated installers can create/update rates
CREATE POLICY "Only auth users can modify utility rates"
  ON utility_rates FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- ACTIVITY_LOG TABLE POLICIES
-- ============================================================

-- Installers can view activity for their own leads
CREATE POLICY "Installers can view own lead activity"
  ON activity_log FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads 
      WHERE installer_id = auth.uid()
    )
  );

-- Installers can log activity for their own leads
CREATE POLICY "Installers can log own lead activity"
  ON activity_log FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads 
      WHERE installer_id = auth.uid()
    )
  );

-- PUBLIC ACCESS: Allow anonymous activity logging for calculator
CREATE POLICY "Allow anonymous activity logging"
  ON activity_log FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads 
      WHERE installer_id IS NULL OR 
            installer_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- ============================================================
-- SECURITY NOTES
-- ============================================================

/*
RLS Enforcement Summary:

1. INSTALLERS table:
   - Users can only view/update their own profile
   - New profiles created via signUp flow

2. LEADS table:
   - Installers can only access their own leads
   - Anonymous users can create leads (for public calculator)
   - Default installer_id (00000000-...) used for unassigned leads

3. INCENTIVES & UTILITY_RATES tables:
   - Public read access (reference data)
   - Only authenticated users can modify

4. ACTIVITY_LOG table:
   - Installers can view/create activity for their leads
   - Anonymous activity logging allowed for public calculator

5. DEFAULT_INSTALLER_ID:
   - Use '00000000-0000-0000-0000-000000000000' for anonymous leads
   - These leads can be claimed by installers later (Phase 6+)

6. Migration Path:
   - Phase 1-2: Anonymous leads only
   - Phase 3: Add installer auth
   - Phase 4+: Full multi-tenant with lead assignment
*/

-- Create default installer for anonymous leads (if needed)
INSERT INTO installers (id, email, company_name, contact_name, state, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'anonymous@system.local',
  'System Default',
  'Anonymous',
  'CA',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
