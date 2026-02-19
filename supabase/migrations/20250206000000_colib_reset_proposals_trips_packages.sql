-- Colib reset: proposals, trips, package_listings (new UX)
-- Run after or instead of previous migrations if you want this schema only.

-- Proposals (from search flow)
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_place text NOT NULL,
  to_place text NOT NULL,
  datetime timestamptz NOT NULL,
  package jsonb NOT NULL,
  price_cents int NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_owner ON public.proposals(owner_id);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposals_own" ON public.proposals;
CREATE POLICY "proposals_own" ON public.proposals
  FOR ALL USING (auth.uid() = owner_id);

-- Trips (published by driver)
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_place text NOT NULL,
  to_place text NOT NULL,
  datetime timestamptz NOT NULL,
  vehicle_type text NOT NULL,
  capacity text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'closed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trips_owner ON public.trips(owner_id);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trips_own" ON public.trips;
CREATE POLICY "trips_own" ON public.trips
  FOR ALL USING (auth.uid() = owner_id);

-- Package listings (published colis)
CREATE TABLE IF NOT EXISTS public.package_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_place text NOT NULL,
  to_place text NOT NULL,
  deadline date NOT NULL,
  length_cm numeric NOT NULL,
  width_cm numeric NOT NULL,
  height_cm numeric NOT NULL,
  weight_kg numeric NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'taken', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_package_listings_owner ON public.package_listings(owner_id);

ALTER TABLE public.package_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "package_listings_own" ON public.package_listings;
CREATE POLICY "package_listings_own" ON public.package_listings
  FOR ALL USING (auth.uid() = owner_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_listings TO authenticated;
