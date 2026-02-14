-- Re-enable RLS for all tables
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.installers;
DROP POLICY IF EXISTS "Users can create profile" ON public.installers;
DROP POLICY IF EXISTS "Users can update own profile" ON public.installers;

-- installers table policies
CREATE POLICY "Users can view own profile"
  ON public.installers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can create profile"
  ON public.installers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.installers FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- leads table policies
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;

CREATE POLICY "Users can view own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = installer_id);

CREATE POLICY "Users can create own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = installer_id);

CREATE POLICY "Users can update own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = installer_id)
  WITH CHECK (auth.uid() = installer_id);

CREATE POLICY "Users can delete own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = installer_id);

-- activity_log table policies
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can create own activity" ON public.activity_log;

CREATE POLICY "Users can view own activity"
  ON public.activity_log FOR SELECT
  USING (auth.uid() = installer_id);

CREATE POLICY "Users can create own activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (auth.uid() = installer_id);
