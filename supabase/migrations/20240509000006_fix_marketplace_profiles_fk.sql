-- Explicitly add Foreign Key relationship between marketplace_items and profiles
-- This allows PostgREST (Supabase) to perform joins like .select('*, profiles(*)')
ALTER TABLE public.marketplace_items
DROP CONSTRAINT IF EXISTS marketplace_items_seller_id_fkey,
ADD CONSTRAINT marketplace_items_seller_id_fkey 
FOREIGN KEY (seller_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Ensure the seller_id column has an index for better join performance
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller_id ON public.marketplace_items(seller_id);
