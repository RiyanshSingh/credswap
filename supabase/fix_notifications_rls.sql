-- Drop incomplete policies
drop policy if exists "Users can update own notifications" on notifications;
drop policy if exists "Users can view own notifications" on notifications;

-- Re-create comprehensive policies

-- 1. SELECT (View)
create policy "Users can view own notifications"
  on notifications for select
  to authenticated
  using (auth.uid() = user_id);

-- 2. UPDATE (Mark as read)
create policy "Users can update own notifications"
  on notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. DELETE (Clear notifications)
create policy "Users can delete own notifications"
  on notifications for delete
  to authenticated
  using (auth.uid() = user_id);
