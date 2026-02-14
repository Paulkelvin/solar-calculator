-- Phase 3: Multi-tenant RLS policies for installers

-- Enable RLS on all tables
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INSTALLERS TABLE POLICIES
-- ============================================

-- Installers can view their own profile
CREATE POLICY "Installers can view own profile"
  ON public.installers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Installers can update their own profile
CREATE POLICY "Installers can update own profile"
  ON public.installers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (for backend) can insert installers
CREATE POLICY "Service role can insert installers"
  ON public.installers
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- LEADS TABLE POLICIES
-- ============================================

-- Installers can view leads they own
CREATE POLICY "Installers can view own leads"
  ON public.leads
  FOR SELECT
  USING (
    installer_id = (
      SELECT id FROM public.installers 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- Service role can insert leads (for public calculator)
CREATE POLICY "Service role can insert leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Installers can update their own leads
CREATE POLICY "Installers can update own leads"
  ON public.leads
  FOR UPDATE
  USING (
    installer_id = (
      SELECT id FROM public.installers 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    installer_id = (
      SELECT id FROM public.installers 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- ============================================
-- ACTIVITY_LOG TABLE POLICIES
-- ============================================

-- Installers can view activity for leads they own
CREATE POLICY "Installers can view activity for own leads"
  ON public.activity_log
  FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM public.leads
      WHERE installer_id = (
        SELECT id FROM public.installers 
        WHERE user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Service role can insert activity
CREATE POLICY "Service role can insert activity"
  ON public.activity_log
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- UTILITY_RATES TABLE POLICIES (Public read)
-- ============================================

-- Everyone can read utility rates
CREATE POLICY "Public can view utility rates"
  ON public.utility_rates
  FOR SELECT
  USING (true);

-- ============================================
-- INCENTIVES TABLE POLICIES (Public read)
-- ============================================

-- Everyone can read incentives
CREATE POLICY "Public can view incentives"
  ON public.incentives
  FOR SELECT
  USING (true);

-- Add user_id to auth.users reference (for linking auth to installers)
-- Note: This is handled automatically by Supabase Auth
