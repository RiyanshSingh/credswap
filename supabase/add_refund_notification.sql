-- Notify Buyer on Refund / Cancellation
create or replace function notify_on_refund()
returns trigger as $$
declare
  item_title text;
begin
  -- Trigger if status changes to 'cancelled' (which implies refund in our logic)
  if new.status = 'cancelled' and old.status != 'cancelled' then
    select title into item_title
    from marketplace_items where id = new.item_id;

    insert into notifications (user_id, title, message, type, link)
    values (new.buyer_id, 'Refund Processed', 'Your order for ' || item_title || ' has been cancelled and refunded.', 'info', '/dashboard?tab=orders');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_refund_notification
after update on marketplace_orders
for each row execute procedure notify_on_refund();
