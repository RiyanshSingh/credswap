-- UPGRADED GLOBAL SEARCH FUNCTION
-- This script adds Internship (Opportunities) to search and makes it more robust.

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
        COALESCE(N.subject, 'General') as item_subtitle,
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
        COALESCE(E.venue, 'Campus') as item_subtitle,
        '/events' as item_url
    FROM events E
    WHERE 
        E.status = 'approved' AND (
            E.title ILIKE '%' || query_text || '%' OR
            E.description ILIKE '%' || query_text || '%'
        )
        
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
        COALESCE(L.location, 'Unknown Location') || ' • ' || COALESCE(to_char(L.date_lost_found, 'DD Mon'), '') as item_subtitle,
        '/lost-and-found' as item_url
    FROM lost_found_items L
    WHERE 
        L.status = 'open' AND (
            L.title ILIKE '%' || query_text || '%' OR
            L.description ILIKE '%' || query_text || '%'
        )

    UNION ALL

    -- Search Marketplace Items
    SELECT 
        'marketplace'::TEXT as item_type,
        M.id as item_id,
        M.title as item_title,
        '₹' || M.price::TEXT as item_subtitle,
        '/marketplace' as item_url
    FROM marketplace_items M
    WHERE 
        M.status = 'approved' AND (
            M.title ILIKE '%' || query_text || '%' OR
            M.description ILIKE '%' || query_text || '%'
        )

    UNION ALL

    -- Search Rooms
    SELECT 
        'room'::TEXT as item_type,
        R.id as item_id,
        R.title as item_title,
        '₹' || R.price::TEXT || '/mo • ' || COALESCE(R.location, 'Local') as item_subtitle,
        '/rooms/' || R.id as item_url
    FROM rooms R
    WHERE 
        R.status = 'available' AND (
            R.title ILIKE '%' || query_text || '%' OR
            R.location ILIKE '%' || query_text || '%'
        )

    UNION ALL

    -- Search Opportunities/Internships (Robust Version)
    SELECT 
        'opportunity'::TEXT as item_type,
        O.id as item_id,
        O.title as item_title,
        COALESCE(O.company, 'Campulsy Partner') || ' • ' || COALESCE(O.location, 'Remote') as item_subtitle,
        '/opportunities/' || O.id as item_url
    FROM opportunities O
    WHERE 
        -- Removing O.status check just in case it's named differently or missing
        (
            O.title ILIKE '%' || query_text || '%' OR
            COALESCE(O.company, '') ILIKE '%' || query_text || '%' OR
            COALESCE(O.description, '') ILIKE '%' || query_text || '%'
        )
    LIMIT 20; -- Ensure we don't overload with too many results
END;
$$;
