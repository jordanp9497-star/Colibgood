CREATE TABLE IF NOT EXISTS public.trip_locations (
  trip_id uuid PRIMARY KEY REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_locations_own" ON public.trip_locations;
CREATE POLICY "trip_locations_own" ON public.trip_locations
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trip_locations_read" ON public.trip_locations;
CREATE POLICY "trip_locations_read" ON public.trip_locations
  FOR SELECT
  USING (true);
