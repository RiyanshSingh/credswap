-- UNBLOCK ATTENDANCE UPDATES & ADMIN VIEW
-- This script disables strict RLS to ensure Admin can see/update everything.

-- 1. Disable RLS on event_registrations to allow Admin to see all statuses
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on profiles to allow Admin to see detailed names/emails
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Explicitly Grant Params
GRANT ALL ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 4. Just in case, re-run the Force Fix for the RPC (redundant but safe)
CREATE OR REPLACE FUNCTION public.mark_attendance(
    ticket_id UUID, 
    scan_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reg_record RECORD;
    user_profile RECORD;
BEGIN
    -- Get Registration
    SELECT * INTO reg_record FROM event_registrations WHERE id = ticket_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid Ticket ID');
    END IF;

    -- Update Status Directly
    UPDATE event_registrations 
    SET status = 'attended' 
    WHERE id = ticket_id;

    -- Get User Details for UI
    SELECT * INTO user_profile FROM profiles WHERE id = reg_record.user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Attendance Verified',
        'user', jsonb_build_object(
            'name', COALESCE(user_profile.full_name, 'Unknown'),
            'email', COALESCE(user_profile.email, 'No Email')
        )
    );
END;
$$;
