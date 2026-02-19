-- =====================================================
-- COHERENCE DB: ajout des colonnes manquantes pour l'API
-- =====================================================

-- Table trips (marketplace)
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS driver_id uuid,
  ADD COLUMN IF NOT EXISTS origin_city text,
  ADD COLUMN IF NOT EXISTS origin_lat numeric,
  ADD COLUMN IF NOT EXISTS origin_lng numeric,
  ADD COLUMN IF NOT EXISTS destination_city text,
  ADD COLUMN IF NOT EXISTS destination_lat numeric,
  ADD COLUMN IF NOT EXISTS destination_lng numeric,
  ADD COLUMN IF NOT EXISTS depart_datetime timestamptz,
  ADD COLUMN IF NOT EXISTS arrive_datetime timestamptz,
  ADD COLUMN IF NOT EXISTS capacity_kg numeric,
  ADD COLUMN IF NOT EXISTS notes text;

-- Supprimer l'ancienne colonne owner_id si elle existe (remplacée par driver_id)
-- ALTER TABLE public.trips DROP COLUMN IF EXISTS owner_id;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_depart ON public.trips(depart_datetime);
CREATE INDEX IF NOT EXISTS idx_trips_origin ON public.trips(origin_city);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination_city);

-- Table proposals (marketplace)
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS listing_id uuid,
  ADD COLUMN IF NOT EXISTS trip_id uuid,
  ADD COLUMN IF NOT EXISTS driver_id uuid,
  ADD COLUMN IF NOT EXISTS shipper_id uuid,
  ADD COLUMN IF NOT EXISTS price_cents int,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Index
CREATE INDEX IF NOT EXISTS idx_proposals_listing_id ON public.proposals(listing_id);
CREATE INDEX IF NOT EXISTS idx_proposals_trip_id ON public.proposals(trip_id);
CREATE INDEX IF NOT EXISTS idx_proposals_driver_id ON public.proposals(driver_id);
CREATE INDEX IF NOT EXISTS idx_proposals_shipper_id ON public.proposals(shipper_id);
