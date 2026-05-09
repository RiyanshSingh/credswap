
-- 1. Ensure Public Read Access for Marketplace Items
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved items" ON public.marketplace_items;
CREATE POLICY "Public can view approved items"
ON public.marketplace_items FOR SELECT
USING (status IN ('approved', 'reserved', 'sold')); 
-- Note: 'reserved' might be interesting to see too, but let's stick to approved/sold usually. 
-- Index.tsx filters for 'approved' specifically.

-- 2. Ensure Public Read Access for Profiles (Name/Avatar)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- 3. Seed Data (Top up with fresh featured items)
-- We need a valid user ID. We'll pick one or fallback.
DO $$
DECLARE
    seller_uuid UUID;
BEGIN
    SELECT id INTO seller_uuid FROM auth.users LIMIT 1;
    
    -- If no user exists, we can't easily insert valid related data, 
    -- but usually there is at least one (Riyansh).
    IF seller_uuid IS NOT NULL THEN
        -- Insert Item 1
        INSERT INTO public.marketplace_items (title, description, price, category, image_url, seller_id, status, created_at)
        VALUES (
            'Engineering Graphics Kit (Unused)', 
            'Complete kit with drafter, clips, and sheets. Never used.', 
            450, 
            'Stationery', 
            'https://m.media-amazon.com/images/I/61K5J0x+cDL._AC_UF1000,1000_QL80_.jpg', 
            seller_uuid, 
            'approved', 
            now()
        );

        -- Insert Item 2
        INSERT INTO public.marketplace_items (title, description, price, category, image_url, seller_id, status, created_at)
        VALUES (
            'Apple iPad 9th Gen (64GB)', 
            'Perfect for note-taking. With Apple Pencil support.', 
            22000, 
            'Electronics', 
            'https://m.media-amazon.com/images/I/61NGnpjoRDL._AC_SL1500_.jpg', 
            seller_uuid, 
            'approved', 
            now() - interval '1 hour'
        );

        -- Insert Item 3
        INSERT INTO public.marketplace_items (title, description, price, category, image_url, seller_id, status, created_at)
        VALUES (
            'Study Lamp (Rechargeable)', 
            'LED Desk lamp with 3 modes. Good battery life.', 
            350, 
            'Furniture', 
            'https://m.media-amazon.com/images/I/61D5jI5+iQL._AC_SL1000_.jpg', 
            seller_uuid, 
            'approved', 
            now() - interval '2 hours'
        );
         -- Insert Item 4
        INSERT INTO public.marketplace_items (title, description, price, category, image_url, seller_id, status, created_at)
        VALUES (
            'Gate Exam Prep Books (CS)', 
            'Full set of Made Easy notes for CSE gate exam.', 
            1500, 
            'Books', 
            'https://m.media-amazon.com/images/I/51w+c+8q+uL._AC_UF1000,1000_QL80_.jpg', 
            seller_uuid, 
            'approved', 
            now() - interval '4 hours'
        );
    END IF;
END $$;
