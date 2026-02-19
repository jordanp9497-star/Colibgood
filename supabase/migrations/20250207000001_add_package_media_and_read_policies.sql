ALTER TABLE public.package_listings
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text;

DROP POLICY IF EXISTS "proposals_read" ON public.proposals;
CREATE POLICY "proposals_read" ON public.proposals FOR SELECT USING (true);

DROP POLICY IF EXISTS "trips_read" ON public.trips;
CREATE POLICY "trips_read" ON public.trips FOR SELECT USING (true);

DROP POLICY IF EXISTS "package_listings_read" ON public.package_listings;
CREATE POLICY "package_listings_read" ON public.package_listings FOR SELECT USING (true);
