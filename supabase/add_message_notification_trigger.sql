-- Trigger: Notify on New Message
-- When a new message is inserted, notify the *recipient*.

create or replace function notify_on_new_message()
returns trigger as $$
declare
  v_conversation record;
  v_recipient_id uuid;
  v_sender_name text;
begin
  -- 1. Get Conversation Details (to find the other participant)
  select * into v_conversation from public.conversations where id = new.conversation_id;
  
  -- 2. Identify Recipient
  if v_conversation.participant1_id = new.sender_id then
    v_recipient_id := v_conversation.participant2_id;
  else
    v_recipient_id := v_conversation.participant1_id;
  end if;

  -- 3. Get Sender Name
  select full_name into v_sender_name from public.profiles where id = new.sender_id;

  -- 4. Create Notification
  -- Link format: /inbox?id=<conversation_id>
  insert into public.notifications (user_id, title, message, type, link)
  values (
    v_recipient_id,
    'New Message from ' || v_sender_name,
    substring(new.content from 1 for 50) || (case when length(new.content) > 50 then '...' else '' end),
    'info',
    '/inbox?id=' || new.conversation_id
  );

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication
drop trigger if exists on_new_message on public.messages;

create trigger on_new_message
after insert on public.messages
for each row execute procedure notify_on_new_message();
