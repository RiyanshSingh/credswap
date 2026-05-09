-- INSERT TEST ATTENDEE V2 (Fixes Foreign Key Error)

DO $$ 
DECLARE
    target_user_id UUID;
    target_event_id UUID;
BEGIN
    -- 1. Find an EXISTING real user (to satisfy foreign key)
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in auth.users. Please sign up at least one user in the app first.';
    END IF;

    -- 2. Get an Event ID
    SELECT id INTO target_event_id FROM events LIMIT 1;

    IF target_event_id IS NULL THEN
        RAISE EXCEPTION 'No events found. Create an event first.';
    END IF;

    -- 3. Ensure Profile Exists (Upsert)
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        target_user_id, 
        'Test Registrant', 
        'test_registrant@example.com',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || target_user_id
    ) ON CONFLICT (id) DO UPDATE 
    SET full_name = 'Test Registrant (Updated)' -- Optional: Just to see change
    WHERE profiles.full_name IS NULL;

    -- 4. Register User to Event
    INSERT INTO public.event_registrations (event_id, user_id, status)
    VALUES (target_event_id, target_user_id, 'registered')
    ON CONFLICT (event_id, user_id) DO UPDATE 
    SET status = 'registered';

    RAISE NOTICE 'Success! Registered User % for Event %', target_user_id, target_event_id;
END $$;
