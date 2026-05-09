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

    -- 2. Get Associated Order (Any status)
    IF v_dispute_record.order_id IS NOT NULL THEN
        SELECT * INTO v_order_record FROM public.task_orders WHERE id = v_dispute_record.order_id;
    ELSE
         -- Remove 'status = escrowed' constraint to handle post-completion disputes
         SELECT * INTO v_order_record FROM public.task_orders 
         WHERE task_id = v_dispute_record.task_id 
         ORDER BY created_at DESC LIMIT 1;
    END IF;

    IF NOT FOUND THEN RAISE EXCEPTION 'No order found for this task'; END IF;

    -- 3. Handle Resolution based on Order Status
    IF v_order_record.status = 'released' OR v_order_record.status = 'completed' THEN
        -- Funds already released
        IF p_resolution = 'release_worker' THEN
            -- Admin wants to release to worker, but it's already done. 
            -- Just close the dispute.
            UPDATE public.task_disputes 
            SET status = 'resolved', resolution_notes = p_notes || ' (Funds were already released)'
            WHERE id = p_dispute_id;
            RETURN;
        ELSIF p_resolution = 'refund_payer' THEN
            -- Cannot auto-refund if funds are gone
            RAISE EXCEPTION 'Funds already released to worker. Cannot auto-refund. Manual intervention required.';
        END IF;

    ELSIF v_order_record.status = 'refunded' THEN
         -- Funds already refunded
         IF p_resolution = 'refund_payer' THEN
            UPDATE public.task_disputes 
            SET status = 'resolved', resolution_notes = p_notes || ' (Funds were already refunded)'
            WHERE id = p_dispute_id;
            RETURN;
         ELSIF p_resolution = 'release_worker' THEN
            RAISE EXCEPTION 'Funds already refunded to payer. Cannot releasing to worker.';
         END IF;

    ELSE 
        -- Status is 'escrowed' (Normal Case)
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

        -- Update Dispute Status
        UPDATE public.task_disputes 
        SET 
            status = 'resolved',
            resolution_notes = p_notes
        WHERE id = p_dispute_id;
    END IF;

END;
$$;
