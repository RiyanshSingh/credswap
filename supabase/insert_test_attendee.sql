-- INSERT TEST ATTENDEE (Run this to verify data appears)

DO $$ 
DECLARE
    test_user_id UUID := gen_random_uuid();
    target_event_id UUID;
BEGIN
    -- 1. Get an Event ID (First one found)
    SELECT id INTO target_event_id FROM events LIMIT 1;

    IF target_event_id IS NULL THEN
        RAISE EXCEPTION 'No events found. Create an event first.';
    END IF;

    -- 2. Create Dummy Profile
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        test_user_id, 
        'Test User ' || substring(test_user_id::text from 1 for 4), 
        'test_' || substring(test_user_id::text from 1 for 4) || '@example.com',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || test_user_id
    ) ON CONFLICT (id) DO NOTHING;

    -- 3. Register User to Event
    INSERT INTO public.event_registrations (event_id, user_id, status)
    VALUES (target_event_id, test_user_id, 'registered');

    RAISE NOTICE 'Test User Created & Registered for Event: %', target_event_id;
END $$;
