-- Grant admins full visibility into rooms and marketplace items for moderation
DROP POLICY IF EXISTS "Admins can view all rooms" ON public.rooms;
CREATE POLICY "Admins can view all rooms" ON public.rooms FOR SELECT 
TO authenticated
USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can view all marketplace items" ON public.marketplace_items;
CREATE POLICY "Admins can view all marketplace items" ON public.marketplace_items FOR SELECT 
TO authenticated
USING ( public.is_admin() );
