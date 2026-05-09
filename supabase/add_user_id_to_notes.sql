-- Add user_id to notes table
alter table notes 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Add status and earnings columns for Dashboard tracking
alter table notes
add column if not exists status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
add column if not exists earnings integer default 0;

-- Allow users to insert their own notes (Essential for Upload page)
create policy "Users can insert own notes"
on notes for insert
to authenticated
with check ( auth.uid() = user_id );

-- Allow users to update their own notes
create policy "Users can update own notes"
on notes for update
to authenticated
using ( auth.uid() = user_id );

-- Allow users to delete their own notes
create policy "Users can delete own notes"
on notes for delete
to authenticated
using ( auth.uid() = user_id );
