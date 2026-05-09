-- 1. Notify Creator on New Application
CREATE OR REPLACE FUNCTION public.notify_on_task_application()
RETURNS TRIGGER AS $$
DECLARE
    v_task_title TEXT;
    v_creator_id UUID;
    v_applicant_name TEXT;
BEGIN
    -- Get Task Details
    SELECT title, creator_id INTO v_task_title, v_creator_id
    FROM public.tasks 
    WHERE id = NEW.task_id;

    -- Get Applicant Name
    SELECT full_name INTO v_applicant_name
    FROM public.profiles
    WHERE id = NEW.applicant_id;

    -- Notify Creator
    IF v_creator_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            v_creator_id,
            'New Task Application',
            v_applicant_name || ' applied for: ' || v_task_title,
            'info',
            '/earn/task/' || NEW.task_id -- Assuming this creates a link to the task details
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_application_insert ON public.task_applications;
CREATE TRIGGER on_task_application_insert
AFTER INSERT ON public.task_applications
FOR EACH ROW EXECUTE PROCEDURE public.notify_on_task_application();


-- 2. Notify Applicant when Accepted (Assigned)
CREATE OR REPLACE FUNCTION public.notify_on_application_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_task_title TEXT;
BEGIN
    -- Only trigger when status changes to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        
        -- Get Task Title
        SELECT title INTO v_task_title
        FROM public.tasks 
        WHERE id = NEW.task_id;

        -- Notify Applicant
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.applicant_id,
            'Application Accepted! 🎉',
            'You have been hired for: ' || v_task_title || '. Start working now!',
            'success',
            '/earn/task/' || NEW.task_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_application_update ON public.task_applications;
CREATE TRIGGER on_task_application_update
AFTER UPDATE ON public.task_applications
FOR EACH ROW EXECUTE PROCEDURE public.notify_on_application_accepted();


-- 3. Notify Creator on Task Submission
CREATE OR REPLACE FUNCTION public.notify_on_task_submission()
RETURNS TRIGGER AS $$
DECLARE
    v_task_title TEXT;
    v_creator_id UUID;
    v_worker_name TEXT;
BEGIN
    -- Get Task Details
    SELECT title, creator_id INTO v_task_title, v_creator_id
    FROM public.tasks 
    WHERE id = NEW.task_id;

    -- Get Worker (Submitter) Name
    SELECT full_name INTO v_worker_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Notify Creator
    IF v_creator_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            v_creator_id,
            'Task Submitted',
            v_worker_name || ' submitted work for: ' || v_task_title || '. Please review.',
            'warning', -- Warning color often used for "Action Required"
            '/earn/task/' || NEW.task_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_submission_insert ON public.task_submissions;
CREATE TRIGGER on_task_submission_insert
AFTER INSERT ON public.task_submissions
FOR EACH ROW EXECUTE PROCEDURE public.notify_on_task_submission();
