-- Solar ROI Calculator Phase 2 Supabase Schema
-- Run these commands in your Supabase SQL editor to set up the database

-- Table 1: Installers
CREATE TABLE installers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
  address JSONB NOT NULL, -- { street, city, state, zip }
  usage JSONB NOT NULL, -- { billAmount?, monthlyKwh? }
  roof JSONB NOT NULL, -- { roofType, squareFeet, sunExposure }
  preferences JSONB NOT NULL, -- { wantsBattery, financingType, timeline, notes }
  contact JSONB NOT NULL, -- { name, email, phone }
  system_size_kw NUMERIC(10,2),
  estimated_annual_production NUMERIC(12,2),
  lead_score NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'new', -- new, contacted, proposal_sent, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: Utility Rates (for future real rate lookups)
CREATE TABLE utility_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  utility_name TEXT NOT NULL,
  rate_per_kwh NUMERIC(6,4),
  escalation_rate NUMERIC(5,2), -- % per year
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(state, utility_name)
);

-- Table 4: Incentives (solar tax credits, rebates, etc.)
CREATE TABLE incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  incentive_type TEXT, -- federal_tax_credit, state_rebate, utility_rebate
  value NUMERIC(12,2),
  value_type TEXT, -- percentage, fixed_amount
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 5: Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- form_submitted, results_viewed, pdf_generated, email_sent, contacted
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_leads_installer_id ON leads(installer_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
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
