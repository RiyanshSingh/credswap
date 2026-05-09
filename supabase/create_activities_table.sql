-- Create Activities Table for Real-time Logging
create table if not exists activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null, -- e.g. "Logged In", "Updated Profile"
  details text, -- e.g. "Updated bio and skills"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table activities enable row level security;

-- Policies
-- 1. Users can insert their own activities (needed for logging from client)
create policy "Users can insert own activities"
on activities for insert
to authenticated
with check ( auth.uid() = user_id );

-- 2. Users can view their own activities
create policy "Users can view own activities"
on activities for select
to authenticated
using ( auth.uid() = user_id );
