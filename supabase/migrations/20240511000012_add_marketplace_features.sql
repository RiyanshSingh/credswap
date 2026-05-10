-- Add listing_type and is_recommended to marketplace_items
-- Also add rental_duration for rent listings

ALTER TABLE public.marketplace_items 
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sell' CHECK (listing_type IN ('sell', 'rent', 'exchange')),
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rental_duration TEXT; -- e.g., 'per day', 'per week'
