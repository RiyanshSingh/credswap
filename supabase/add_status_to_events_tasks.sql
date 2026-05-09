-- Add status column to events table
alter table events
add column if not exists status text check (status in ('pending', 'approved', 'rejected')) default 'pending';

-- Add status column to tasks table
alter table tasks
add column if not exists status text check (status in ('pending', 'approved', 'rejected')) default 'pending';

-- RLS Policies for Admin (Assuming we want to restrict update, but for now we rely on app logic since we don't have an "admin" role in Supabase auth yet)
-- We will rely on existing RLS for SELECT (public) and restrict UPDATE in the UI or via additional RLS if needed later.
-- For now, allow public read of approved items (should be updated in RLS later, but for MVP keeping it simple).
