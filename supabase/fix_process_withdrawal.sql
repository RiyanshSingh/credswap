-- Fix process_withdrawal RPC function
CREATE OR REPLACE FUNCTION public.process_withdrawal(request_id UUID, action TEXT, note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req_record RECORD;
BEGIN
    -- Check Admin (RLS handles this usually, but safety check)
    IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized';
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
