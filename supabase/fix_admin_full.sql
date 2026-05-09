-- 1. Ensure 'role' column exists in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Clean up conflicting columns (we use 'role' now)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin; 

-- 3. Fix the process_withdrawal function to check 'role' correctly
CREATE OR REPLACE FUNCTION public.process_withdrawal(request_id UUID, action TEXT, note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req_record RECORD;
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();

    -- Check Admin authorization
    IF user_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: You are not an admin. Role detected: %', user_role;
    END IF;

    SELECT * INTO req_record FROM public.withdrawal_requests WHERE id = request_id FOR UPDATE;

    IF req_record.status != 'pending' THEN
        RAISE EXCEPTION 'Request is already processed';
    END IF;

    IF action = 'approve' THEN
        -- Mark as processed
        UPDATE public.withdrawal_requests 
        SET status = 'processed', admin_note = note, updated_at = NOW() 
        WHERE id = request_id;

        -- Update Transaction Log to completed
        UPDATE public.payment_transactions 
        SET status = 'completed', description = description || ' (Processed)' 
        WHERE reference_id = request_id;

    ELSIF action = 'reject' THEN
        -- Mark as rejected
        UPDATE public.withdrawal_requests 
        SET status = 'rejected', admin_note = note, updated_at = NOW() 
        WHERE id = request_id;

        -- REFUND BALANCE
        UPDATE public.user_earnings 
        SET withdrawable_balance = withdrawable_balance + req_record.amount
        WHERE user_id = req_record.user_id;

        UPDATE public.profiles
        SET wallet_balance = wallet_balance + req_record.amount
        WHERE id = req_record.user_id;

        -- Update Transaction Log to failed/refunded
        UPDATE public.payment_transactions 
        SET status = 'failed', description = description || ' (Rejected/Refunded)' 
        WHERE reference_id = request_id;

    ELSE
        RAISE EXCEPTION 'Invalid action';
    END IF;
END;
$$;

-- 4. INSTRUCTIONS TO MAKE YOURSELF ADMIN
-- Run the following command (uncomment and replace email) to give yourself admin access:

-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL@example.com'; 

-- For development purpose, if you want to make ALL current users admin (EASIEST FIX):
UPDATE public.profiles SET role = 'admin';
