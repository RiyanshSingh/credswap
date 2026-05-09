-- Allow anyone to view rooms with status 'available'
-- Allow room owners to view their own rooms (any status)
-- Allow admins to view all rooms (already handled by admin RPC)

-- First, ensure RLS is enabled on rooms table
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Drop old/conflicting policies if any
DROP POLICY IF EXISTS "Anyone can view available rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can view their own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can insert their own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can update their own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can delete their own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can view all rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can update all rooms" ON public.rooms;

-- PUBLIC: Anyone (logged in or not) can view available rooms
CREATE POLICY "Anyone can view available rooms" ON public.rooms
FOR SELECT USING (status = 'available');

-- OWNERS: Can view their own rooms (including pending/rejected)
CREATE POLICY "Owners can view their own rooms" ON public.rooms
FOR SELECT TO authenticated
USING (owner_id = auth.uid());

-- OWNERS: Can insert their own rooms
CREATE POLICY "Owners can insert their own rooms" ON public.rooms
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

-- OWNERS: Can update their own rooms
CREATE POLICY "Owners can update their own rooms" ON public.rooms
FOR UPDATE TO authenticated
USING (owner_id = auth.uid());

-- OWNERS: Can delete their own rooms
CREATE POLICY "Owners can delete their own rooms" ON public.rooms
FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- ADMINS: Can view ALL rooms (for moderation - using is_admin() which checks auth session)
-- Note: Admin dashboard uses credential-based RPC (admin_get_pending_rooms) to bypass this
CREATE POLICY "Admins can view all rooms" ON public.rooms
FOR SELECT TO authenticated
USING (public.is_admin());

-- ADMINS: Can update any room status (approve/reject)
CREATE POLICY "Admins can update all rooms" ON public.rooms
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
