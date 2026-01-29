-- Phase 6.2: Add lead status field
ALTER TABLE public.leads 
ADD COLUMN status VARCHAR(20) DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'contacted', 'converted', 'lost'));

-- Create index for status filtering
CREATE INDEX idx_leads_status ON public.leads(status);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'status';
