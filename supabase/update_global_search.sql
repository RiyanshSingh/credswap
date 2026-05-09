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
        )

    UNION ALL

    -- Search Marketplace Items (NEW)
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
            M.description ILIKE '%' || query_text || '%' OR
            M.category ILIKE '%' || query_text || '%'
        )

    UNION ALL

    -- Search Rooms (NEW)
    SELECT 
        'room'::TEXT as item_type,
        R.id as item_id,
        R.title as item_title,
        '₹' || R.price::TEXT || '/mo • ' || R.location as item_subtitle,
        '/rooms/' || R.id as item_url
    FROM rooms R
    WHERE 
        R.status = 'available' AND (
            R.title ILIKE '%' || query_text || '%' OR
            R.location ILIKE '%' || query_text || '%' OR
            R.type ILIKE '%' || query_text || '%'
        )

    UNION ALL

    -- Search Opportunities/Internships (NEW)
    SELECT 
        'opportunity'::TEXT as item_type,
        O.id as item_id,
        O.title as item_title,
        O.company || ' • ' || O.location as item_subtitle,
        '/opportunities/' || O.id as item_url
    FROM opportunities O
    WHERE 
        (
            O.title ILIKE '%' || query_text || '%' OR
            O.company ILIKE '%' || query_text || '%' OR
            O.description ILIKE '%' || query_text || '%'
        )

    UNION ALL

    -- Search Roadmaps (NEW)
    SELECT 
        'roadmap'::TEXT as item_type,
        RM.id as item_id,
        RM.title as item_title,
        COALESCE(RM.difficulty, 'Roadmap') as item_subtitle,
        '/roadmap/' || RM.slug as item_url
    FROM roadmaps RM
    WHERE 
        RM.title ILIKE '%' || query_text || '%' OR
        RM.description ILIKE '%' || query_text || '%';
END;
$$;
