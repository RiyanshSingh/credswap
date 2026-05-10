
-- 1. Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- 2. Add an embedding column to the marketplace_items table
-- 1536 dimensions is standard for OpenAI's text-embedding-3-small model
alter table public.marketplace_items 
add column if not exists embedding vector(1536);

-- 3. Create a function to find similar items based on vector similarity
-- This will be used by the React frontend via .rpc()
create or replace function get_recommended_items(
    item_id uuid,
    match_threshold float default 0.5,
    match_count int default 5
)
returns setof public.marketplace_items
language plpgsql
security definer
as $$
declare
    target_embedding vector(1536);
    target_category text;
begin
    -- Get the embedding and category for the reference item
    select embedding, category into target_embedding, target_category
    from public.marketplace_items
    where id = item_id;

    -- CASE 1: The reference item has an embedding (AI is ready)
    if target_embedding is not null then
        return query
        select *
        from public.marketplace_items
        where id != item_id
        and status = 'approved'
        -- Use cosine similarity (<=>)
        and 1 - (embedding <=> target_embedding) > match_threshold
        order by embedding <=> target_embedding
        limit match_count;

    -- CASE 2: Fallback to Category + Status if no embedding exists yet
    else
        return query
        select *
        from public.marketplace_items
        where id != item_id
        and status = 'approved'
        and category = target_category
        order by created_at desc
        limit match_count;
    end if;
end;
$$;

-- 4. Create a function to get recommendations for a specific user profile
-- This is a "Cold Start" hybrid approach: looks at user's major/interests
create or replace function get_personalized_recommendations(
    p_user_id uuid,
    p_limit int default 10
)
returns setof public.marketplace_items
language plpgsql
security definer
as $$
declare
    v_major text;
    v_seed float;
begin
    -- Get user's major/branch from profile
    select branch into v_major from public.profiles where id = p_user_id;
    
    -- Generate a stable but unique seed for the user to keep recommendations consistent for THEM
    -- but different for OTHERS.
    v_seed := ('x' || substr(md5(p_user_id::text), 1, 8))::bit(32)::int::float / 2147483647.0;

    return query
    select *
    from public.marketplace_items
    where status = 'approved'
    order by 
        case 
            -- Prioritize items that might be relevant to their branch in descriptions
            when v_major is not null and (description ilike '%' || v_major || '%' or title ilike '%' || v_major || '%') then 0
            -- Then prioritize featured items
            when is_featured = true then 1
            else 2
        end,
        -- Use a random seed based on user ID to make it "User Based"
        md5(id::text || p_user_id::text) -- This ensures User A always sees Set A, and User B always sees Set B
    limit p_limit;
end;
$$;

-- Allow anonymous and authenticated users to call these functions
grant execute on function get_recommended_items(uuid, float, int) to anon, authenticated;
grant execute on function get_personalized_recommendations(uuid, int) to anon, authenticated;
