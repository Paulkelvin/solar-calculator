-- =================================================================
-- FIX: Enable Anonymous Lead Creation for Calculator
-- =================================================================
-- Run this in your Supabase SQL Editor to fix the "Could not find column" error

BEGIN;

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Installers can create leads" ON leads;
DROP POLICY IF EXISTS "Installers can create own activity logs" ON activity_log;
DROP POLICY IF EXISTS "Public read/write leads" ON leads;
DROP POLICY IF EXISTS "Public read/write activity_log" ON activity_log;

-- SIMPLIFIED APPROACH: Allow public access for calculator
-- Policy: Allow anyone to create leads (public calculator)
CREATE POLICY "Allow public lead creation"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to read leads (for now)
CREATE POLICY "Allow public read leads"
  ON leads FOR SELECT
  USING (true);

-- Policy: Allow anonymous activity logging
CREATE POLICY "Allow public activity logging"
  ON activity_log FOR INSERT
  WITH CHECK (true);

-- Policy: Allow public read of activity logs
CREATE POLICY "Allow public read activity logs"
  ON activity_log FOR SELECT
  USING (true);

-- Grant permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT ON TABLE leads TO anon;
GRANT INSERT, SELECT ON TABLE activity_log TO anon;

-- Also allow the foreign key constraint to be violated temporarily
-- by making installer_id nullable on leads and activity_log
ALTER TABLE leads ALTER COLUMN installer_id DROP NOT NULL;
ALTER TABLE activity_log ALTER COLUMN installer_id DROP NOT NULL;

COMMIT;

-- =================================================================
-- Verification
-- =================================================================
-- After running, verify policies are active:
-- SELECT policyname FROM pg_policies WHERE tablename = 'leads';
-- SELECT policyname FROM pg_policies WHERE tablename = 'activity_log';
