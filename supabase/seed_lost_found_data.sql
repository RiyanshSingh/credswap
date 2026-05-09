-- Link to the specific user: Riyansh Singh
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Set specific user ID
    target_user_id := '1c170d87-60d0-4b2b-8da6-8d67a2b117df';

    -- If no user exists, do nothing (or raise notice)
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No user ID provided.';
        RETURN;
    END IF;

    -- Insert 10 Lost Items
    INSERT INTO lost_found_items (title, description, type, category, date_lost_found, location, contact_info, status, user_id) VALUES
    ('Lost iPhone 13', 'Blue iPhone 13 with a clear case. Lock screen is a picture of a dog.', 'lost', 'Electronics', CURRENT_DATE - 1, 'Library 2nd Floor', 'student@college.edu', 'open', target_user_id),
    ('Black Leather Wallet', 'Contains ID, Driver License, and some cash.', 'lost', 'Other', CURRENT_DATE - 2, 'Cafeteria', 'student@college.edu', 'open', target_user_id),
    ('Calculus Textbook', 'Thomas Calculus, 14th Edition. Has highlight marks.', 'lost', 'Books', CURRENT_DATE - 3, 'Lecture Hall A', 'student@college.edu', 'open', target_user_id),
    ('Car Keys (Toyota)', 'Toyota key fob with a red keychain.', 'lost', 'Keys', CURRENT_DATE - 4, 'Parking Lot B', 'student@college.edu', 'open', target_user_id),
    ('Blue Hoodie', 'Nike hoodie, size M. Left on a bench.', 'lost', 'Clothing', CURRENT_DATE - 5, 'Sports Complex', 'student@college.edu', 'open', target_user_id),
    ('AirPods Pro', 'In a white case with a sticker of a cat.', 'lost', 'Electronics', CURRENT_DATE - 1, 'Gym Lockers', 'student@college.edu', 'open', target_user_id),
    ('Water Bottle', 'Metal hydroflask with stickers.', 'lost', 'Other', CURRENT_DATE - 2, 'Main Building Lobby', 'student@college.edu', 'open', target_user_id),
    ('ID Card', 'Student ID card for Engineering Dept.', 'lost', 'Documents', CURRENT_DATE - 3, 'Bus Stop', 'student@college.edu', 'open', target_user_id),
    ('Lab Coat', 'White lab coat with name initals JK.', 'lost', 'Clothing', CURRENT_DATE - 4, 'Chemistry Lab', 'student@college.edu', 'open', target_user_id),
    ('Notebook', 'Spiral notebook with physics notes.', 'lost', 'Books', CURRENT_DATE, 'Library', 'student@college.edu', 'open', target_user_id);

    -- Insert 10 Found Items
    INSERT INTO lost_found_items (title, description, type, category, date_lost_found, location, contact_info, status, user_id) VALUES
    ('Found Umbrella', 'Black umbrella found under a seat.', 'found', 'Other', CURRENT_DATE, 'Auditorium', 'admin@college.edu', 'open', target_user_id),
    ('Scientific Calculator', 'Casio fx-991EX Classwiz found on table.', 'found', 'Electronics', CURRENT_DATE - 1, 'Exam Hall 3', 'admin@college.edu', 'open', target_user_id),
    ('Reading Glasses', 'Black rimmed reading glasses.', 'found', 'Other', CURRENT_DATE - 2, 'Coffee Shop', 'admin@college.edu', 'open', target_user_id),
    ('Set of Keys', '3 keys on a silver ring.', 'found', 'Keys', CURRENT_DATE - 3, 'Bike Stand', 'admin@college.edu', 'open', target_user_id),
    ('Debit Card', 'HDFC Bank Debit Card (handed to security).', 'found', 'Documents', CURRENT_DATE - 4, 'ATM near Gate 1', 'admin@college.edu', 'open', target_user_id),
    ('Smart Watch', 'Fitbit band, black strap.', 'found', 'Electronics', CURRENT_DATE - 1, 'Running Track', 'admin@college.edu', 'open', target_user_id),
    ('Backpack', 'Grey Herschel backpack.', 'found', 'Other', CURRENT_DATE - 2, 'Student Center', 'admin@college.edu', 'open', target_user_id),
    ('Earrings', 'Gold hoop earrings found in restroom.', 'found', 'Other', CURRENT_DATE - 3, 'Girls Restroom, 1st Floor', 'admin@college.edu', 'open', target_user_id),
    ('USB Drive', 'SanDisk 64GB, lots of project files.', 'found', 'Electronics', CURRENT_DATE - 4, 'Computer Lab 2', 'admin@college.edu', 'open', target_user_id),
    ('Scarf', 'Red wool scarf.', 'found', 'Clothing', CURRENT_DATE, 'Entrance Hall', 'admin@college.edu', 'open', target_user_id);

END $$;
