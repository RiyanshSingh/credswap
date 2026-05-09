-- P2P TASKS SCHEMA UPDATE

-- 1. Upgrade Tasks Table for P2P
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0, -- Budget
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open', -- open, assigned, in_progress, completed, disputed, cancelled
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- 2. Create Task Applications Table
CREATE TABLE IF NOT EXISTS public.task_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    bid_amount NUMERIC, -- Optional: Allow bidding different from price
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Task Orders (Escrow) Table
CREATE TABLE IF NOT EXISTS public.task_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id),
    payer_id UUID REFERENCES public.profiles(id),
    payee_id UUID REFERENCES public.profiles(id),
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'escrowed', -- escrowed, released, refunded
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_orders ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Task Applications
CREATE POLICY "Public can view applications" ON public.task_applications FOR SELECT USING (true);
CREATE POLICY "Users can apply" ON public.task_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Creator can update applications" ON public.task_applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND creator_id = auth.uid())
);

-- Task Orders
CREATE POLICY "Users view own orders" ON public.task_orders FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);


-- 6. RPC: Hire Worker (Escrow Funds)
CREATE OR REPLACE FUNCTION public.hire_worker(
    p_task_id UUID,
    p_worker_id UUID,
    p_application_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_record RECORD;
    v_payer_balance NUMERIC;
    v_order_id UUID;
BEGIN
    -- 1. Get Task & Lock
    SELECT * INTO v_task_record FROM public.tasks WHERE id = p_task_id FOR UPDATE;
    
    IF v_task_record.status != 'open' THEN
        RAISE EXCEPTION 'Task is not open';
    END IF;

    -- 2. Check Payer Balance
    SELECT wallet_balance INTO v_payer_balance FROM public.profiles WHERE id = auth.uid();
    
    IF v_payer_balance < v_task_record.price THEN
        RAISE EXCEPTION 'Insufficient funds in wallet';
    END IF;

    -- 3. Deduct Funds (Escrow)
    UPDATE public.profiles 
    SET wallet_balance = wallet_balance - v_task_record.price 
    WHERE id = auth.uid();

    -- 4. Create Task Order (Escrow Record)
    INSERT INTO public.task_orders (task_id, payer_id, payee_id, amount, status)
    VALUES (p_task_id, auth.uid(), p_worker_id, v_task_record.price, 'escrowed')
    RETURNING id INTO v_order_id;

    -- 5. Update Task
    UPDATE public.tasks 
    SET 
        worker_id = p_worker_id,
        status = 'assigned'
    WHERE id = p_task_id;

    -- 6. Update Application Status
    UPDATE public.task_applications SET status = 'accepted' WHERE id = p_application_id;
    UPDATE public.task_applications SET status = 'rejected' WHERE task_id = p_task_id AND id != p_application_id; -- Reject others

    -- 7. Log Transaction
    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (
        auth.uid(), 
        v_task_record.price, 
        'debit', 
        'purchase', -- 'task_escrow'
        'completed', 
        'Hired worker for task: ' || v_task_record.title, 
        v_order_id
    );

    RETURN v_order_id;
END;
$$;


-- 7. RPC: Approve Work (Release Funds)
CREATE OR REPLACE FUNCTION public.approve_task_work(
    p_task_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_record RECORD;
BEGIN
    -- 1. Get Escrow Order
    SELECT * INTO v_order_record FROM public.task_orders 
    WHERE task_id = p_task_id AND status = 'escrowed';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active escrow found for this task';
    END IF;

    -- 2. Verify Caller is Payer
    IF v_order_record.payer_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 3. Release Funds to Worker
    UPDATE public.profiles 
    SET 
        wallet_balance = COALESCE(wallet_balance, 0) + v_order_record.amount,
        total_earned = COALESCE(total_earned, 0) + v_order_record.amount
    WHERE id = v_order_record.payee_id;

    -- 4. Update Order Status
    UPDATE public.task_orders SET status = 'released' WHERE id = v_order_record.id;

    -- 5. Update Task Status
    UPDATE public.tasks SET status = 'completed' WHERE id = p_task_id;

    -- 6. Log Transaction (Worker Earning)
    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (
        v_order_record.payee_id, 
        v_order_record.amount, 
        'credit', 
        'task_earning', 
        'completed', 
        'Payment received for task completion', 
        v_order_record.id
    );

END;
$$;
