-- device_tokens: stocke les Expo Push Tokens par appareil (plusieurs appareils par user)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_tokens_select_own" ON public.device_tokens;
CREATE POLICY "device_tokens_select_own" ON public.device_tokens
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "device_tokens_insert_own" ON public.device_tokens;
CREATE POLICY "device_tokens_insert_own" ON public.device_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "device_tokens_delete_own" ON public.device_tokens;
CREATE POLICY "device_tokens_delete_own" ON public.device_tokens
  FOR DELETE USING (user_id = auth.uid());

-- Option: champ sur profiles pour un seul token (si vous préférez 1 token/user)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token text;
