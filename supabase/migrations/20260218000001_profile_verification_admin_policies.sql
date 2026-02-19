ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_verifications_own" ON public.profile_verifications;
DROP POLICY IF EXISTS "profile_verifications_read" ON public.profile_verifications;
DROP POLICY IF EXISTS "profile_verifications_select_own" ON public.profile_verifications;
DROP POLICY IF EXISTS "profile_verifications_insert_own" ON public.profile_verifications;
DROP POLICY IF EXISTS "profile_verifications_update_own" ON public.profile_verifications;
DROP POLICY IF EXISTS "profile_verifications_admin_select" ON public.profile_verifications;
DROP POLICY IF EXISTS "profile_verifications_admin_update" ON public.profile_verifications;

CREATE POLICY "profile_verifications_select_own" ON public.profile_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profile_verifications_insert_own" ON public.profile_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_verifications_update_own" ON public.profile_verifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profile_verifications_admin_select" ON public.profile_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "profile_verifications_admin_update" ON public.profile_verifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );
