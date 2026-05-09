-- Social Proof Tables

-- 1. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies for Comments
-- Policies for Comments
DROP POLICY IF EXISTS "Public can view comments" ON comments;
CREATE POLICY "Public can view comments" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);


-- 2. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(note_id, user_id) -- One rating per user per note
);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Policies for Ratings
DROP POLICY IF EXISTS "Public can view ratings" ON ratings;
CREATE POLICY "Public can view ratings" ON ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can upsert own ratings" ON ratings;
CREATE POLICY "Users can upsert own ratings" ON ratings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON ratings;
CREATE POLICY "Users can update own ratings" ON ratings FOR UPDATE
USING (auth.uid() = user_id);


-- 3. Global Search Function (RPC)
-- Searches Notes, Events, Tasks, AND Lost & Found Items
DROP FUNCTION IF EXISTS search_content(text);

CREATE OR REPLACE FUNCTION search_content(query_text TEXT)
RETURNS TABLE (
    item_type TEXT,
    item_id UUID,
    item_title TEXT,
    item_subtitle TEXT,
    item_url TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    -- Search Notes
    SELECT 
        'note'::TEXT as item_type,
        N.id as item_id,
        N.title as item_title,
        N.subject as item_subtitle,
        '/notes/' || N.id as item_url
    FROM notes N
    WHERE 
        N.status = 'approved' AND (
            N.title ILIKE '%' || query_text || '%' OR
            N.subject ILIKE '%' || query_text || '%'
        )
    
    UNION ALL
    
    -- Search Events
    SELECT 
        'event'::TEXT as item_type,
        E.id as item_id,
        E.title as item_title,
        E.venue as item_subtitle,
        '/events' as item_url
    FROM events E
    WHERE 
        E.title ILIKE '%' || query_text || '%'
        -- E.description removed as column does not exist
        
    UNION ALL
    
    -- Search Tasks
    SELECT 
        'task'::TEXT as item_type,
        T.id as item_id,
        T.title as item_title,
        'Earn ₹' || T.reward as item_subtitle,
        '/earn' as item_url
    FROM tasks T
    WHERE 
        T.title ILIKE '%' || query_text || '%' OR
        T.description ILIKE '%' || query_text || '%'
        
    UNION ALL

    -- Search Lost & Found Items
    SELECT 
        L.type::TEXT as item_type, -- 'lost' or 'found'
        L.id as item_id,
        L.title as item_title,
        COALESCE(L.location, 'Unknown Location') || ' • ' || to_char(L.date_lost_found, 'DD Mon') as item_subtitle,
        '/lost-and-found?search=' || L.title as item_url
    FROM lost_found_items L
    WHERE 
        L.status = 'open' AND (
            L.title ILIKE '%' || query_text || '%' OR
            L.description ILIKE '%' || query_text || '%' OR
            L.category ILIKE '%' || query_text || '%'
        );
END;
$$;
