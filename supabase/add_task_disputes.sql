-- Create Task Disputes Table
CREATE TABLE IF NOT EXISTS public.task_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    raised_by UUID REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- open, resolved, rejected
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_disputes ENABLE ROW LEVEL SECURITY;

-- Policies for Task Disputes
CREATE POLICY "Public view disputes" ON public.task_disputes FOR SELECT USING (true); -- Or restrict to participants + admin

CREATE POLICY "Participants can raise dispute" ON public.task_disputes FOR INSERT WITH CHECK (
    auth.uid() = raised_by
);

-- Link to Escrow (Optional but good for tracking)
ALTER TABLE public.task_disputes ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.task_orders(id);

-- RPC to Resolve Task Dispute (Replaces resolve_dispute for tasks)
CREATE OR REPLACE FUNCTION public.resolve_task_dispute(
    p_dispute_id UUID,
    p_resolution TEXT, -- 'refund_payer' or 'release_worker'
    p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dispute_record RECORD;
    v_order_record RECORD;
BEGIN
    -- 1. Get Dispute
    SELECT * INTO v_dispute_record FROM public.task_disputes WHERE id = p_dispute_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Dispute not found'; END IF;

    -- 2. Get Associated Order (Escrow)
    -- Try to find active escrow for this task if order_id is null
    IF v_dispute_record.order_id IS NOT NULL THEN
        SELECT * INTO v_order_record FROM public.task_orders WHERE id = v_dispute_record.order_id;
    ELSE
         SELECT * INTO v_order_record FROM public.task_orders 
         WHERE task_id = v_dispute_record.task_id AND status = 'escrowed' 
         ORDER BY created_at DESC LIMIT 1;
    END IF;

    IF NOT FOUND THEN RAISE EXCEPTION 'No active escrow found for this dispute'; END IF;

    -- 3. Handle Resolution
    IF p_resolution = 'refund_payer' THEN
        -- Refund Payer
        UPDATE public.profiles 
        SET wallet_balance = wallet_balance + v_order_record.amount
        WHERE id = v_order_record.payer_id;

        UPDATE public.task_orders SET status = 'refunded' WHERE id = v_order_record.id;
        UPDATE public.tasks SET status = 'cancelled' WHERE id = v_order_record.task_id;

    ELSIF p_resolution = 'release_worker' THEN
        -- Release to Worker
        UPDATE public.profiles 
        SET wallet_balance = wallet_balance + v_order_record.amount,
            total_earned = total_earned + v_order_record.amount
        WHERE id = v_order_record.payee_id;

        UPDATE public.task_orders SET status = 'released' WHERE id = v_order_record.id;
        UPDATE public.tasks SET status = 'completed' WHERE id = v_order_record.task_id;
        
        -- Log txn for worker
        INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
        VALUES (v_order_record.payee_id, v_order_record.amount, 'credit', 'task_earning', 'completed', 'Dispute resolved: Funds released', v_order_record.id);

    ELSE
        RAISE EXCEPTION 'Invalid resolution type';
    END IF;

    -- 4. Update Dispute Status
    UPDATE public.task_disputes 
    SET 
        status = 'resolved',
        resolution_notes = p_notes
    WHERE id = p_dispute_id;

END;
$$;
