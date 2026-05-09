-- Fix Profiles RLS to ensure Owner Name is visible
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Ensure RPC permissions
grant execute on function public.get_or_create_conversation(uuid, uuid, uuid) to authenticated;
grant execute on function public.get_or_create_conversation(uuid, uuid, uuid) to anon; -- Just in case, though usually authenticated

-- Verify Foreign Keys for Conversations (Optional, just to be safe)
-- alter table conversations drop constraint if exists conversations_participant1_id_fkey;
-- alter table conversations add constraint conversations_participant1_id_fkey foreign key (participant1_id) references auth.users(id); 
-- (Keeping references to auth.users for now as per original schema is safer for Auth, profiles is for display)
