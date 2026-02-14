-- Solar ROI Calculator: Complete Schema Setup
-- Phase 1-6.1: Database schema with authentication, leads, and RLS policies
-- 
-- SETUP INSTRUCTIONS:
-- 1. Create a Supabase project at https://supabase.com
-- 2. Get Project URL and Anon Key from Project Settings > API
-- 3. Copy this entire file into Supabase SQL Editor
-- 4. Run all queries (Select All > Cmd+Enter)
-- 5. Update .env.local with your credentials
-- 6. Restart npm run dev

-- ============================================================================
-- IMPORTANT: Installers table structure for Phase 6.1
-- ============================================================================
-- The installers table connects to Supabase auth.users table
-- Each installer account has a corresponding row here
-- This enables per-installer lead scoping via RLS

CREATE TABLE installers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  website TEXT,
  state TEXT DEFAULT 'CA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_installers_email ON installers(email);

-- ============================================================================
-- Leads table: Updated to use auth.users.id for installer_id
-- ============================================================================
-- If this table already exists, you may need to update the schema
-- Add installer_id column if it doesn't exist

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
  address JSONB NOT NULL,
  usage JSONB NOT NULL,
  roof JSONB NOT NULL,
  preferences JSONB NOT NULL,
  contact JSONB NOT NULL,
  system_size_kw NUMERIC(10,2),
  estimated_annual_production NUMERIC(12,2),
  lead_score NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_leads_installer_id ON leads(installer_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ============================================================================
-- Utility Rates table
-- ============================================================================
CREATE TABLE utility_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  utility_name TEXT NOT NULL,
  rate_per_kwh NUMERIC(6,4),
  escalation_rate NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(state, utility_name)
);

-- ============================================================================
-- Incentives table
-- ============================================================================
CREATE TABLE incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  incentive_type TEXT,
  value NUMERIC(12,2),
  value_type TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- Activity Log table
-- ============================================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_activity_log_installer_id ON activity_log(installer_id);
CREATE INDEX idx_activity_log_lead_id ON activity_log(lead_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: installers table
-- ============================================================================

-- Users can view their own installer profile
CREATE POLICY "Users can view own profile" ON installers
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON installers
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- New users can create their installer profile during signup
CREATE POLICY "New users can create profile" ON installers
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: leads table
-- ============================================================================

-- Installers can view only their own leads
CREATE POLICY "Installers can view own leads" ON leads
  FOR SELECT
  USING (auth.uid() = installer_id);

-- Installers can create leads
CREATE POLICY "Installers can create leads" ON leads
  FOR INSERT
  WITH CHECK (auth.uid() = installer_id);

-- Installers can update their own leads
CREATE POLICY "Installers can update own leads" ON leads
  FOR UPDATE
  USING (auth.uid() = installer_id)
  WITH CHECK (auth.uid() = installer_id);

-- Installers can delete their own leads
CREATE POLICY "Installers can delete own leads" ON leads
  FOR DELETE
  USING (auth.uid() = installer_id);

-- ============================================================================
-- RLS POLICIES: activity_log table
-- ============================================================================

-- Installers can view their own activity logs
CREATE POLICY "Installers can view own activity logs" ON activity_log
  FOR SELECT
  USING (auth.uid() = installer_id);

-- Installers can create activity logs for their own leads
CREATE POLICY "Installers can create own activity logs" ON activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = installer_id);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE installers TO authenticated;
GRANT ALL ON TABLE leads TO authenticated;
GRANT ALL ON TABLE activity_log TO authenticated;
GRANT ALL ON TABLE utility_rates TO authenticated;
GRANT ALL ON TABLE incentives TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify setup was successful)
-- ============================================================================
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check installers table has correct structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'installers' ORDER BY ordinal_position;

-- Check leads table has installer_id:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' WHERE column_name = 'installer_id';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('installers', 'leads', 'activity_log');

-- Check RLS policies exist:
-- SELECT tablename, policyname, permissive, roles FROM pg_policies WHERE tablename IN ('installers', 'leads', 'activity_log') ORDER BY tablename, policyname;
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_activity_log_lead_id ON activity_log(lead_id);
CREATE INDEX idx_activity_log_installer_id ON activity_log(installer_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Phase 2: Simple RLS policies (will be enhanced with auth later)
-- For now: public read/write (development mode)
CREATE POLICY "Public read/write leads" ON leads FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Public read/write activity_log" ON activity_log FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Insert default installer for Phase 1/2
INSERT INTO installers (id, name, email, company)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Phase 1/2 Demo',
  'demo@solarcalc.local',
  'Demo Installer'
);
