-- Create Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    location TEXT NOT NULL,
    type TEXT CHECK (type IN ('Single', 'Shared', 'PG', 'Flat')) DEFAULT 'Single',
    amenities TEXT[] DEFAULT '{}', -- e.g., ['WiFi', 'AC', 'Food']
    images TEXT[] DEFAULT '{}', -- Array of image URLs
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('available', 'taken')) DEFAULT 'available',
    contact_phone TEXT, -- Optional direct contact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public can view available rooms
CREATE POLICY "Public can view available rooms" 
ON rooms FOR SELECT 
USING (status = 'available');

-- 2. Users can view their own rooms (even if taken)
CREATE POLICY "Users can view own rooms" 
ON rooms FOR SELECT 
USING (auth.uid() = owner_id);

-- 3. Users can insert their own rooms
CREATE POLICY "Users can list rooms" 
ON rooms FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- 4. Owners can update their rooms
CREATE POLICY "Owners can update their rooms" 
ON rooms FOR UPDATE 
USING (auth.uid() = owner_id);

-- 5. Owners can delete their rooms
CREATE POLICY "Owners can delete their rooms" 
ON rooms FOR DELETE 
USING (auth.uid() = owner_id);

-- Dummy Seed Data (Optional)
-- INSERT INTO rooms (title, price, location, type, amenities, images, status, owner_id) ...
