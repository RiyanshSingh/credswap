DO $$
BEGIN
    -- Add description column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='description') THEN
        ALTER TABLE events ADD COLUMN description text;
    END IF;

    -- Add category column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='category') THEN
        ALTER TABLE events ADD COLUMN category text DEFAULT 'General';
    END IF;

    -- Add image_url column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='image_url') THEN
        ALTER TABLE events ADD COLUMN image_url text;
    END IF;

    -- Add is_featured column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_featured') THEN
        ALTER TABLE events ADD COLUMN is_featured boolean DEFAULT false;
    END IF;

    -- Add organizer column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='organizer') THEN
        ALTER TABLE events ADD COLUMN organizer text DEFAULT 'Admin';
    END IF;

END $$;
