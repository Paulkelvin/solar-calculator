-- Add welcome_email_sent column to installers table
-- This tracks whether the welcome email has been sent to prevent duplicates

ALTER TABLE installers 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_installers_welcome_email ON installers(welcome_email_sent);

-- Update existing installers to mark as not sent
UPDATE installers SET welcome_email_sent = FALSE WHERE welcome_email_sent IS NULL;
