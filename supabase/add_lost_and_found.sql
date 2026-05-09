-- Create lost_found_items table
CREATE TABLE IF NOT EXISTS lost_found_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('lost', 'found')) NOT NULL,
    category TEXT CHECK (category IN ('Electronics', 'Books', 'Clothing', 'Keys', 'Documents', 'Other')) NOT NULL,
    date_lost_found DATE NOT NULL,
    location TEXT NOT NULL,
    image_url TEXT,
    contact_info TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'resolved')) DEFAULT 'open',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view items
CREATE POLICY "Lost and Found items are viewable by everyone" 
ON lost_found_items FOR SELECT 
USING (true);

-- Authenticated users can create items
CREATE POLICY "Users can create lost and found items" 
ON lost_found_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own items
CREATE POLICY "Users can update their own items" 
ON lost_found_items FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own items
CREATE POLICY "Users can delete their own items" 
ON lost_found_items FOR DELETE 
USING (auth.uid() = user_id);

-- Storage bucket for lost and found images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lost_found_images', 'lost_found_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Public view access
CREATE POLICY "Lost Found Images are publicly accessible" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'lost_found_images' );

-- Authenticated upload access
CREATE POLICY "Authenticated users can upload lost found images" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'lost_found_images' AND auth.role() = 'authenticated' );

-- Users can update/delete their own images
CREATE POLICY "Users can update their own lost found images" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'lost_found_images' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own lost found images" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'lost_found_images' AND auth.uid() = owner );
