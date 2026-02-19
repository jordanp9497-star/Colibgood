-- Ensure consistency for V1 workflow (idempotent)
-- Only applies if the "marketplace" schema exists (with listing_id columns)

-- Prevent multiple shipments for same listing (only if listing_id column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipments' 
    AND column_name = 'listing_id'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_unique_listing_id 
    ON public.shipments(listing_id);
  END IF;
END $$;

-- Prevent multiple accepted proposals for same listing (only if listing_id column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proposals' 
    AND column_name = 'listing_id'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_unique_accepted_per_listing
    ON public.proposals(listing_id)
    WHERE status = 'accepted';
  END IF;
END $$;

