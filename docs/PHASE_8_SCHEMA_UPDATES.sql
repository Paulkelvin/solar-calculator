-- Phase 8: Add lead notes and solar data columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS solar_potential_kwh_annual NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS roof_imagery_url TEXT;

-- Add index for searching by notes
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
