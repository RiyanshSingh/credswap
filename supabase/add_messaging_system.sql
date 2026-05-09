-- In-App Messaging System

-- 1. Create Conversations Table
-- Tracks unique pairs of users + optional item context
create table if not exists conversations (
  id uuid default uuid_generate_v4() primary key,
  participant1_id uuid references auth.users(id) not null,
  participant2_id uuid references auth.users(id) not null,
  item_id uuid references marketplace_items(id), -- Optional: Chat about specific item
  last_message text,
  last_message_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique pair per item (or generic pair if item is null)
  -- We'll use a constraint to prevent duplicate convos between same users for same item
  unique(participant1_id, participant2_id, item_id)
);

-- 2. Create Messages Table
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table conversations enable row level security;
alter table messages enable row level security;

-- 4. RLS Policies

-- Conversations: View if you are a participant
create policy "Users can view their conversations"
  on conversations for select
  to authenticated
  using (auth.uid() = participant1_id or auth.uid() = participant2_id);

-- Messages: View if you are part of the conversation
create policy "Users can view messages in their conversations"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.participant1_id = auth.uid() or c.participant2_id = auth.uid())
    )
  );

-- Messages: Insert if you are part of the conversation (and sender is you)
create policy "Users can send messages to their conversations"
  on messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.participant1_id = auth.uid() or c.participant2_id = auth.uid())
    )
  );

-- 5. RPC: Get or Create Conversation
-- Simplifies frontend logic. Checks if chat exists, if not creates it.
-- Ensures p1 is always < p2 to maintain consistency (avoid duplicate A-B vs B-A) causes optional complexity, 
-- but for now we'll just check both directions or rely on the specific unique constraint logic.
-- Actually, let's keep it simple: just try select, if empty insert.

create or replace function get_or_create_conversation(
  other_user_id uuid,
  related_item_id uuid default null
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

  -- Check if conversation exists (ignoring order of participants)
  select id into conv_id
  from conversations
  where 
    ((participant1_id = current_user_id and participant2_id = other_user_id)
    or (participant1_id = other_user_id and participant2_id = current_user_id))
    and (item_id is not distinct from related_item_id)
  limit 1;

  -- If found, return it
  if conv_id is not null then
    return conv_id;
  end if;

  -- If not found, create it
  insert into conversations (participant1_id, participant2_id, item_id, last_message, last_message_at)
  values (current_user_id, other_user_id, related_item_id, 'Started a new conversation', now())
  returning id into conv_id;

  return conv_id;
end;
$$;
