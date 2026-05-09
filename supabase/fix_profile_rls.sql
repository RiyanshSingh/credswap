-- FIX: Ensure users can UPDATE AND INSERT their own profiles
-- This is necessary if the profile row is missing (failed trigger) and we use upsert

-- 1. Drop existing policies to avoid conflicts
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;

-- 2. Allow UPDATE (Editing existing profile)
create policy "Users can update own profile"
on profiles for update
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- 3. Allow INSERT (Creating missing profile)
create policy "Users can insert own profile"
on profiles for insert
to authenticated
with check ( auth.uid() = id );

-- 4. Enable RLS (Should be already on, but good to ensure)
alter table profiles enable row level security;
