-- Grant usage on schema public and permissions on tables to anon/authenticated.
-- Required for Supabase client (mobile app) to access tables when using the anon key + JWT.

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Tables: allow authenticated (and anon where needed). RLS still applies.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proofs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;

-- anon: minimal (e.g. for unauthenticated reads if needed later)
GRANT SELECT ON public.profiles TO anon;

-- Sequences (for tables using DEFAULT gen_random_uuid() we don't need sequence grants)
-- If any table used SERIAL, we'd grant USAGE, SELECT on the sequence.

-- Allow anon to read profiles only (e.g. public profile view). Skip if you don't need it.
-- Already granted above: GRANT SELECT ON public.profiles TO anon;
