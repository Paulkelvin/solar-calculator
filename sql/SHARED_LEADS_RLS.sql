-- =================================================================
-- SHARED LEADS: All admins see all leads
-- =================================================================
-- Run this in your Supabase SQL Editor.
-- This replaces per-installer scoping with shared access.
-- All authenticated admins can see, update, and delete ALL leads.
-- Public (anonymous) users can still create leads from the calculator.

BEGIN;

-- ---------------------------------------------------------------
-- 1. Drop ALL existing policies on leads and activity_log
-- ---------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies 
             WHERE tablename IN ('leads', 'activity_log') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- 2. Ensure installer_id is nullable (for anonymous calculator)
-- ---------------------------------------------------------------
ALTER TABLE leads ALTER COLUMN installer_id DROP NOT NULL;
ALTER TABLE activity_log ALTER COLUMN installer_id DROP NOT NULL;

-- ---------------------------------------------------------------
-- 3. LEADS policies — shared access for all authenticated users
-- ---------------------------------------------------------------

-- Public (anonymous) users can create leads from the calculator
CREATE POLICY "Public can create leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Any authenticated user can read ALL leads
CREATE POLICY "Authenticated users read all leads"
  ON leads FOR SELECT
  USING (true);

-- Any authenticated user can update ANY lead
CREATE POLICY "Authenticated users update all leads"
  ON leads FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Any authenticated user can delete ANY lead
CREATE POLICY "Authenticated users delete all leads"
  ON leads FOR DELETE
  USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------
-- 4. ACTIVITY_LOG policies — shared access
-- ---------------------------------------------------------------

-- Public can create activity logs (from calculator)
CREATE POLICY "Public can create activity logs"
  ON activity_log FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read all activity logs
CREATE POLICY "Authenticated users read all activity logs"
  ON activity_log FOR SELECT
  USING (true);

-- ---------------------------------------------------------------
-- 5. Grant permissions
-- ---------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT INSERT, SELECT ON TABLE leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE leads TO authenticated;

GRANT INSERT, SELECT ON TABLE activity_log TO anon;
GRANT SELECT, INSERT ON TABLE activity_log TO authenticated;

COMMIT;

-- =================================================================
-- Verification — run these after to confirm:
-- =================================================================
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'leads';
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'activity_log';
