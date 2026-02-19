-- Migration idempotente: tables core + RLS
-- Supabase/Postgres

-- =============================================================================
-- EXTENSIONS (si besoin)
-- =============================================================================
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('shipper', 'driver', 'admin')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- listings
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  origin_city text,
  origin_lat numeric,
  origin_lng numeric,
  destination_city text,
  destination_lat numeric,
  destination_lng numeric,
  pickup_date date,
  delivery_deadline timestamptz,
  weight_kg numeric,
  size_category text,
  price_cents int,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_shipper_id ON public.listings(shipper_id);

-- trips
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  origin_city text,
  origin_lat numeric,
  origin_lng numeric,
  destination_city text,
  destination_lat numeric,
  destination_lng numeric,
  depart_datetime timestamptz,
  arrive_datetime timestamptz,
  capacity_kg numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- proposals
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  driver_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  shipper_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  price_cents int,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_listing_id ON public.proposals(listing_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_listing_status ON public.proposals(listing_id, status);

-- shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  shipper_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pickup_scheduled', 'picked_up', 'in_transit', 'delivered', 'disputed', 'cancelled')),
  pickup_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON public.shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_id ON public.shipments(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_status ON public.shipments(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_status ON public.shipments(shipper_id, status);

-- shipment_events
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);

-- proofs
CREATE TABLE IF NOT EXISTS public.proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  type text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- =============================================================================
-- RLS: activer sur toutes les tables
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICIES (idempotentes: DROP IF EXISTS puis CREATE)
-- =============================================================================

-- --- profiles: lecture/update uniquement sur soi; admin peut tout lire ---
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- --- listings: shipper propriétaire ---
DROP POLICY IF EXISTS "listings_select_shipper" ON public.listings;
CREATE POLICY "listings_select_shipper" ON public.listings
  FOR SELECT USING (shipper_id = auth.uid());

DROP POLICY IF EXISTS "listings_insert_shipper" ON public.listings;
CREATE POLICY "listings_insert_shipper" ON public.listings
  FOR INSERT WITH CHECK (shipper_id = auth.uid());

DROP POLICY IF EXISTS "listings_update_shipper" ON public.listings;
CREATE POLICY "listings_update_shipper" ON public.listings
  FOR UPDATE USING (shipper_id = auth.uid());

DROP POLICY IF EXISTS "listings_delete_shipper" ON public.listings;
CREATE POLICY "listings_delete_shipper" ON public.listings
  FOR DELETE USING (shipper_id = auth.uid());

-- --- trips: driver propriétaire; shipper peut lire si proposition liée ---
DROP POLICY IF EXISTS "trips_select_driver" ON public.trips;
CREATE POLICY "trips_select_driver" ON public.trips
  FOR SELECT USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "trips_select_shipper_via_proposal" ON public.trips;
CREATE POLICY "trips_select_shipper_via_proposal" ON public.trips
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.proposals pr WHERE pr.trip_id = trips.id AND pr.shipper_id = auth.uid())
  );

DROP POLICY IF EXISTS "trips_insert_driver" ON public.trips;
CREATE POLICY "trips_insert_driver" ON public.trips
  FOR INSERT WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS "trips_update_driver" ON public.trips;
CREATE POLICY "trips_update_driver" ON public.trips
  FOR UPDATE USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "trips_delete_driver" ON public.trips;
CREATE POLICY "trips_delete_driver" ON public.trips
  FOR DELETE USING (driver_id = auth.uid());

-- --- proposals: shipper ou driver concerné ---
DROP POLICY IF EXISTS "proposals_select_party" ON public.proposals;
CREATE POLICY "proposals_select_party" ON public.proposals
  FOR SELECT USING (shipper_id = auth.uid() OR driver_id = auth.uid());

DROP POLICY IF EXISTS "proposals_insert_driver_or_shipper" ON public.proposals;
CREATE POLICY "proposals_insert_driver_or_shipper" ON public.proposals
  FOR INSERT WITH CHECK (driver_id = auth.uid() OR shipper_id = auth.uid());

DROP POLICY IF EXISTS "proposals_update_party" ON public.proposals;
CREATE POLICY "proposals_update_party" ON public.proposals
  FOR UPDATE USING (shipper_id = auth.uid() OR driver_id = auth.uid());

DROP POLICY IF EXISTS "proposals_delete_party" ON public.proposals;
CREATE POLICY "proposals_delete_party" ON public.proposals
  FOR DELETE USING (shipper_id = auth.uid() OR driver_id = auth.uid());

-- --- shipments: shipper ou driver concerné ---
DROP POLICY IF EXISTS "shipments_select_party" ON public.shipments;
CREATE POLICY "shipments_select_party" ON public.shipments
  FOR SELECT USING (shipper_id = auth.uid() OR driver_id = auth.uid());

DROP POLICY IF EXISTS "shipments_insert_party" ON public.shipments;
CREATE POLICY "shipments_insert_party" ON public.shipments
  FOR INSERT WITH CHECK (shipper_id = auth.uid() OR driver_id = auth.uid());

DROP POLICY IF EXISTS "shipments_update_party" ON public.shipments;
CREATE POLICY "shipments_update_party" ON public.shipments
  FOR UPDATE USING (shipper_id = auth.uid() OR driver_id = auth.uid());

DROP POLICY IF EXISTS "shipments_delete_party" ON public.shipments;
CREATE POLICY "shipments_delete_party" ON public.shipments
  FOR DELETE USING (shipper_id = auth.uid() OR driver_id = auth.uid());

-- --- shipment_events: via shipment => shipper ou driver du shipment ---
DROP POLICY IF EXISTS "shipment_events_select_party" ON public.shipment_events;
CREATE POLICY "shipment_events_select_party" ON public.shipment_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_events.shipment_id
        AND (s.shipper_id = auth.uid() OR s.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "shipment_events_insert_party" ON public.shipment_events;
CREATE POLICY "shipment_events_insert_party" ON public.shipment_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_events.shipment_id
        AND (s.shipper_id = auth.uid() OR s.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "shipment_events_update_party" ON public.shipment_events;
CREATE POLICY "shipment_events_update_party" ON public.shipment_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_events.shipment_id
        AND (s.shipper_id = auth.uid() OR s.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "shipment_events_delete_party" ON public.shipment_events;
CREATE POLICY "shipment_events_delete_party" ON public.shipment_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_events.shipment_id
        AND (s.shipper_id = auth.uid() OR s.driver_id = auth.uid())
    )
  );

-- --- proofs: via shipment => shipper ou driver ---
DROP POLICY IF EXISTS "proofs_select_party" ON public.proofs;
CREATE POLICY "proofs_select_party" ON public.proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = proofs.shipment_id
        AND (s.shipper_id = auth.uid() OR s.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "proofs_insert_party" ON public.proofs;
CREATE POLICY "proofs_insert_party" ON public.proofs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = proofs.shipment_id
        AND (s.shipper_id = auth.uid() OR s.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "proofs_update_party" ON public.proofs;
CREATE POLICY "proofs_update_party" ON public.proofs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = proofs.shipment_id
        AND (s.shipper_id = auth.uid() OR s.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "proofs_delete_party" ON public.proofs;
CREATE POLICY "proofs_delete_party" ON public.proofs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = proofs.shipment_id
        AND (s.shipper_id = auth.uid() OR s.driver_id = auth.uid())
    )
  );

-- --- notifications: utilisateur propriétaire ---
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
