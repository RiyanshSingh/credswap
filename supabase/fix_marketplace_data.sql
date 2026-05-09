-- FIX ORPHANED MARKETPLACE ITEMS
-- Assigns any items with NULL user_id to the generic 'Campulsy User' or the current admin running this.
-- Since we can't easily guess, we will Update them to the ID of the user running this script (you).

UPDATE public.marketplace_items
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- Also verify if any items have a user_id that does NOT exist in profiles
-- (Optional cleanup, but safer to just update them too if possible, or leave them)
-- UPDATE public.marketplace_items
-- SET user_id = auth.uid()
-- WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- ENSURE marketplace_items is readable
-- (RLS might be hiding user_id if policy is weird, but select * usually returns it)
DROP POLICY IF EXISTS "Marketplace items are viewable by everyone" ON public.marketplace_items;
CREATE POLICY "Marketplace items are viewable by everyone"
ON public.marketplace_items FOR SELECT
USING (true);

-- Ensure user_id column is NOT NULL for future
-- ALTER TABLE public.marketplace_items ALTER COLUMN user_id SET NOT NULL;
