CREATE TABLE IF NOT EXISTS public.profile_verifications (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('shipper', 'driver')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  id_doc_url text,
  vehicle_doc_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_verifications_own" ON public.profile_verifications;
CREATE POLICY "profile_verifications_own" ON public.profile_verifications
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profile_verifications_read" ON public.profile_verifications;
CREATE POLICY "profile_verifications_read" ON public.profile_verifications
  FOR SELECT
  USING (true);
