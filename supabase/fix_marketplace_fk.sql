
-- Fix Foreign Key for marketplace_items to allow joining with profiles
-- Currently it References auth.users, which prevents PostgREST from embedding 'profiles'.

BEGIN;

-- 1. Drop the old Foreign Key constraint
-- We need to know its name. Usually it's "marketplace_items_seller_id_fkey" or similar.
-- We'll try generic names or just DROP CONSTRAINT IF EXISTS.
ALTER TABLE public.marketplace_items 
DROP CONSTRAINT IF EXISTS marketplace_items_seller_id_fkey;

-- 2. Add the NEW Foreign Key constraint referencing public.profiles
ALTER TABLE public.marketplace_items
ADD CONSTRAINT marketplace_items_seller_id_fkey
FOREIGN KEY (seller_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. Just to be safe, Refresh the schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
