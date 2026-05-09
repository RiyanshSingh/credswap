-- 1. ADD MISSING COLUMNS TO PROFILES (For Settings)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS github TEXT,
ADD COLUMN IF NOT EXISTS portfolio TEXT,
ADD COLUMN IF NOT EXISTS resume_link TEXT;

-- 2. CREATE WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    method TEXT NOT NULL, -- 'upi', 'bank'
    details TEXT NOT NULL, -- UPI ID or Bank Details
    status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'rejected'
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT min_withdrawal CHECK (amount >= 100)
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests 
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- 3. RPC: REQUEST WITHDRAWAL
-- Deducts from withdrawable_balance immediately.
CREATE OR REPLACE FUNCTION public.request_withdrawal(amount NUMERIC, method TEXT, details TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance NUMERIC;
    new_request_id UUID;
BEGIN
    -- Check Balance
    SELECT withdrawable_balance INTO current_balance 
    FROM public.user_earnings 
    WHERE user_id = auth.uid();

    IF current_balance IS NULL OR current_balance < amount THEN
        RAISE EXCEPTION 'Insufficient withdrawable balance.';
    END IF;

    -- Deduct Balance
    UPDATE public.user_earnings 
    SET withdrawable_balance = withdrawable_balance - amount
    WHERE user_id = auth.uid();

    -- Sync Profile
    UPDATE public.profiles
    SET wallet_balance = wallet_balance - amount
    WHERE id = auth.uid();

    -- Create Request
    INSERT INTO public.withdrawal_requests (user_id, amount, method, details)
    VALUES (auth.uid(), amount, method, details)
    RETURNING id INTO new_request_id;

    -- Log Transaction
    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (auth.uid(), amount, 'debit', 'withdrawal', 'pending', 'Withdrawal Request via ' || method, new_request_id);

    RETURN new_request_id;
END;
$$;


-- 4. RPC: PROCESS WITHDRAWAL (Admin)
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
