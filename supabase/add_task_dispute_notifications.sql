-- Trigger Function to Notify when a Task Dispute is raised
CREATE OR REPLACE FUNCTION notify_on_new_task_dispute()
RETURNS TRIGGER AS $$
DECLARE
    v_task_title TEXT;
    v_creator_id UUID;
    v_worker_id UUID;
    v_recipient_id UUID;
    v_notification_title TEXT;
    v_notification_message TEXT;
BEGIN
    -- 1. Get Task Details (Creator, Worker, Title)
    SELECT title, creator_id, worker_id 
    INTO v_task_title, v_creator_id, v_worker_id
    FROM public.tasks 
    WHERE id = NEW.task_id;

    -- 2. Determine Receiver
    -- If raised by Creator -> Notify Worker
    -- If raised by Worker -> Notify Creator
    IF NEW.raised_by = v_creator_id THEN
        v_recipient_id := v_worker_id;
        v_notification_title := 'Dispute Opened by Creator';
        v_notification_message := 'A dispute has been raised for task: ' || v_task_title || '. Please check the dispute center.';
    ELSE
        v_recipient_id := v_creator_id;
        v_notification_title := 'Dispute Opened by Worker';
        v_notification_message := 'The worker has raised a dispute for task: ' || v_task_title || '. Please check the dispute center.';
    END IF;

    -- 3. Insert Notification
    -- Only if we have a valid recipient
    IF v_recipient_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            v_recipient_id,
            v_notification_title,
            v_notification_message,
            'warning',
            '/dispute/' || NEW.id || '?type=task'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_task_dispute_insert ON public.task_disputes;

CREATE TRIGGER on_task_dispute_insert
AFTER INSERT ON public.task_disputes
FOR EACH ROW EXECUTE PROCEDURE notify_on_new_task_dispute();
