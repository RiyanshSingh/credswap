
-- 1. Add columns to track the user's last browsing context
alter table public.profiles 
add column if not exists last_browsed_category text,
add column if not exists last_viewed_item_id uuid references public.marketplace_items(id);

-- 2. Update the recommendation engine to be "Contextually Dynamic"
-- It now rotates over time and responds to specific item views
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
    v_last_browsed text;
    v_last_item_id uuid;
    v_last_item_embedding vector(1536);
begin
    -- Get user's context
    select branch, last_browsed_category, last_viewed_item_id 
    into v_major, v_last_browsed, v_last_item_id 
    from public.profiles 
    where id = p_user_id;

    -- Get embedding of the last viewed item if available
    if v_last_item_id is not null then
        select embedding into v_last_item_embedding 
        from public.marketplace_items 
        where id = v_last_item_id;
    end if;

    return query
    select *
    from public.marketplace_items
    where status = 'approved'
    -- Don't recommend the item they just saw
    and (v_last_item_id is null or id != v_last_item_id)
    order by 
        case 
            -- Priority 1: Vector Similarity to the item they JUST viewed (AI context)
            when v_last_item_embedding is not null then (embedding <=> v_last_item_embedding)
            -- Priority 2: Matches their academic major
            when v_major is not null and (description ilike '%' || v_major || '%' or title ilike '%' || v_major || '%') then 0.1
            -- Priority 3: Matches their last browsed category
            when v_last_browsed is not null and category = v_last_browsed then 0.2
            -- Priority 4: Featured items
            when is_featured = true then 0.3
            else 0.5
        end,
        -- Shuffling factor: Changes every 5 minutes to keep it fresh
        md5(id::text || p_user_id::text || floor(extract(epoch from now()) / 300)::text)
    limit p_limit;
end;
$$;
