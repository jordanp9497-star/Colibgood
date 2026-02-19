-- Fix: "Infinite recursion detected in policy for relation profiles"
-- La politique profiles_select_admin lisait public.profiles dans une sous-requête,
-- ce qui ré-invoquait la RLS sur profiles => récursion. On utilise une fonction
-- SECURITY DEFINER qui lit profiles sans passer par la RLS.

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  );
$$;

-- Remplacer la politique qui causait la récursion
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.current_user_is_admin());
