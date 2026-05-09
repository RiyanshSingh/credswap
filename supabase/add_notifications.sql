-- 1. Create Notifications Table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table notifications enable row level security;

-- 3. Policies
create policy "Users can view own notifications"
  on notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  to authenticated
  using (auth.uid() = user_id);

-- 4. Triggers for Automation

-- A. Notify Seller on New Order
create or replace function notify_on_new_order()
returns trigger as $$
declare
  item_title text;
  seller_id uuid;
begin
  select title, seller_id into item_title, seller_id
  from marketplace_items where id = new.item_id;

  insert into notifications (user_id, title, message, type, link)
  values (seller_id, 'New Order Received', 'Someone ordered your item: ' || item_title, 'success', '/dashboard?tab=orders');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_order_notification
after insert on marketplace_orders
for each row execute procedure notify_on_new_order();


-- B. Notify Seller on Funds Released (Order Completed)
create or replace function notify_on_order_completed()
returns trigger as $$
declare
  item_title text;
begin
  -- Only trigger if status changed to 'completed'
  if new.status = 'completed' and old.status != 'completed' then
    select title into item_title
    from marketplace_items where id = new.item_id;

    insert into notifications (user_id, title, message, type, link)
    values (new.seller_id, 'Funds Released', 'Order completed for ' || item_title || '. Funds added to wallet.', 'success', '/dashboard?tab=earnings');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_completed_notification
after update on marketplace_orders
for each row execute procedure notify_on_order_completed();


-- C. Notify Student on Task Approval
create or replace function notify_on_task_approval()
returns trigger as $$
declare
  task_title text;
begin
  if new.status = 'approved' and old.status != 'approved' then
    select title into task_title
    from tasks where id = new.task_id;

    insert into notifications (user_id, title, message, type, link)
    values (new.user_id, 'Task Approved', 'Your submission for ' || task_title || ' has been approved. Reward credited!', 'success', '/dashboard?tab=earnings');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_task_approval_notification
after update on task_submissions
for each row execute procedure notify_on_task_approval();


-- D. Notify on Dispute Updates
create or replace function notify_on_dispute_update()
returns trigger as $$
declare
  buyer_id uuid;
  seller_id uuid;
begin
  -- Fetch involved parties from the Order
  select buyer_id, seller_id into buyer_id, seller_id
  from marketplace_orders where id = new.order_id;

  -- Notify Buyer
  insert into notifications (user_id, title, message, type, link)
  values (buyer_id, 'Dispute Update', 'Dispute status changed to: ' || new.status, 'warning', '/dashboard?tab=orders');

  -- Notify Seller
  insert into notifications (user_id, title, message, type, link)
  values (seller_id, 'Dispute Update', 'Dispute status changed to: ' || new.status, 'warning', '/dashboard?tab=orders');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_dispute_update_notification
after update on marketplace_disputes
for each row execute procedure notify_on_dispute_update();
