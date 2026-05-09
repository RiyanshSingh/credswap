-- Update Messaging System for Lost & Found Support

-- 1. Add lost_item_id column to conversations
-- (Assuming lost_found_items is the table name, derived from LostItemDetails.tsx)
alter table public.conversations
add column if not exists lost_item_id uuid references public.lost_found_items(id) on delete set null;

-- 2. Add Unique Index for Lost & Found Conversations
-- We want to ensure one chat per user-pair per lost-item.
create unique index if not exists conversations_lost_item_unique_idx
on public.conversations(participant1_id, participant2_id, lost_item_id)
where lost_item_id is not null;

-- 3. Update get_or_create_conversation RPC
-- We update the function signature (drop old one first to avoid signature conflicts if necessary, 
-- or use create or replace with new defaults if allowed (Postgres allows overloading, but we want to replace the logic).
-- To be safe, we'll CREATE OR REPLACE with specific arguments.
-- Note: Changing arguments of an existing function usually requires DROP if usage is ambiguous, 
-- but adding a default parameter usually works as a new overload. 
-- However, we want the SAME name to be used by frontend. 
-- The cleanest way is to replace the function.

drop function if exists get_or_create_conversation(uuid, uuid); -- Drop potentially conflicting signatures

create or replace function get_or_create_conversation(
  other_user_id uuid,
  related_item_id uuid default null,
  related_lost_item_id uuid default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  conv_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  -- Check if conversation exists
  select id into conv_id
  from conversations
  where 
    ((participant1_id = current_user_id and participant2_id = other_user_id)
    or (participant1_id = other_user_id and participant2_id = current_user_id))
    and (item_id is not distinct from related_item_id)
    and (lost_item_id is not distinct from related_lost_item_id)
  limit 1;

  -- If found, return it
  if conv_id is not null then
    return conv_id;
  end if;

  -- If not found, create it
  insert into conversations (
    participant1_id, 
    participant2_id, 
    item_id, 
    lost_item_id, 
    last_message, 
    last_message_at
  )
  values (
    current_user_id, 
    other_user_id, 
    related_item_id, 
    related_lost_item_id, 
    'Started a new conversation', 
    now()
  )
  returning id into conv_id;

  return conv_id;
end;
$$;
