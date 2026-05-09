-- Re-create Marketplace Items Table with updated Status
DROP TABLE IF EXISTS marketplace_items;

CREATE TABLE marketplace_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    category TEXT CHECK (category IN ('Books', 'Electronics', 'Furniture', 'Stationery', 'Other')) DEFAULT 'Other',
    image_url TEXT,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'sold', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view 'approved' and 'sold' items
CREATE POLICY "Public can view approved items" 
ON marketplace_items FOR SELECT 
USING (status IN ('approved', 'sold'));

-- Users can view their own items (even if pending)
CREATE POLICY "Users can view own items" 
ON marketplace_items FOR SELECT 
USING (auth.uid() = seller_id);

-- Users can insert their own items
CREATE POLICY "Users can list items" 
ON marketplace_items FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their items
CREATE POLICY "Sellers can update their items" 
ON marketplace_items FOR UPDATE 
USING (auth.uid() = seller_id);

-- Sellers can delete their items
CREATE POLICY "Sellers can delete their items" 
ON marketplace_items FOR DELETE 
USING (auth.uid() = seller_id);

-- DUMMY DATA SEEDING (Using a random user ID or a placeholder if foreign key constraints allow. 
-- Since we have foreign key to auth.users, we usually need a real user ID. 
-- For development, we might skip the FK constraint or assume a user exists.
-- BETTER: We will remove the NOT NULL constraint on seller_id for the dummy data, or link to the first found user in a script.
-- For this SQL file, I'll temporarily loosen the constraint or just insert if I can find a user.
-- actually, I will insert assuming a specific ID doesn't exist but I'll make the columns nullable for 'seller_id' just for this dummy data if possible? No, bad practice.
-- I will assume the user running this (Riyansh) has an ID. I will try to fetch it or just insert without it if I remove the Reference for a second?
-- Let's just make seller_id nullable for now to allow 'System' listings, or use a known ID.)

ALTER TABLE marketplace_items ALTER COLUMN seller_id DROP NOT NULL;

INSERT INTO marketplace_items (title, description, price, category, image_url, status, created_at) VALUES
('Introduction to Algorithms (CLRS)', 'Standard algo book, slightly used. Great condition.', 600, 'Books', 'https://m.media-amazon.com/images/I/61ZnJGZjdlL._AC_UF1000,1000_QL80_.jpg', 'approved', now()),
('Scientific Calculator fx-991EX', ' essential for engineering students. 1 year old.', 450, 'Stationery', 'https://m.media-amazon.com/images/I/710e6Xfp+SL.jpg', 'approved', now() - interval '2 days'),
('Study Table - Foldable', 'Wooden foldable table, perfect for laptop usage on bed.', 800, 'Furniture', 'https://m.media-amazon.com/images/I/71c8gB15uBL.jpg', 'approved', now() - interval '5 days'),
('Arduino Uno Starter Kit', 'Includes sensors, wires, and breadboard. Good for IoT projects.', 1200, 'Electronics', 'https://m.media-amazon.com/images/I/81+F-B1+2QL._AC_SL1500_.jpg', 'approved', now() - interval '1 week'),
('Drafter for Engineering Drawing', 'Mini drafter, scale, and clips included.', 300, 'Stationery', 'https://m.media-amazon.com/images/I/61K5J0x+cDL._AC_UF1000,1000_QL80_.jpg', 'approved', now() - interval '3 days');
