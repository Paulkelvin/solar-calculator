-- Add share_token column to leads table for public estimate sharing
-- This allows customers to access their estimate via /estimate/[token]

-- Add share_token column (UUID, unique, indexed)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_leads_share_token ON leads(share_token);

-- Backfill existing leads with tokens (if any exist without one)
UPDATE leads
SET share_token = gen_random_uuid()
WHERE share_token IS NULL;

-- Add appointment scheduling fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS scheduled_appointment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS appointment_notes TEXT;

-- Comment for documentation
COMMENT ON COLUMN leads.share_token IS 'Unique token for public estimate access via /estimate/[token]';
COMMENT ON COLUMN leads.scheduled_appointment_at IS 'When customer scheduled an appointment with the installer';
COMMENT ON COLUMN leads.appointment_notes IS 'Notes from appointment booking (time preferences, questions)';
