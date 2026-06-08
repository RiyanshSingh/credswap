-- 0. Update Marketplace Order Status Constraints for Escrow/Disputes
ALTER TABLE public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_status_check_v4;
ALTER TABLE public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_status_check_v3;
ALTER TABLE public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_status_check_v2;
ALTER TABLE public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_status_check;

ALTER TABLE public.marketplace_orders
ADD CONSTRAINT marketplace_orders_status_check_v5
CHECK (status IN (
    'pending', 
    'pending_delivery', 
    'delivered', 
    'completed', 
    'cancelled', 
    'payment_pending', 
    'paid', 
    'shipped', 
    'disputed', 
    'paid_escrow',
    'resolved_refund',
    'resolved_seller'
));

-- 1. Extend Marketplace Orders for better tracking
ALTER TABLE public.marketplace_orders 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payout_completed BOOLEAN DEFAULT FALSE;

-- 2. Extend Profiles for Escrow/Hold logic
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(10,2) DEFAULT 0.00;

-- 3. Dispute Chats & Messages (Group Chat Support)
CREATE TABLE IF NOT EXISTS public.dispute_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    admin_id UUID REFERENCES public.profiles(id), -- Assigned admin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix for potential existing table from legacy migrations
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispute_messages' AND table_schema = 'public') THEN
        -- Drop policies that might depend on chat_id/dispute_id before altering type
        DROP POLICY IF EXISTS "Participants can view messages" ON public.dispute_messages;
        DROP POLICY IF EXISTS "Participants can view dispute messages" ON public.dispute_messages;
        DROP POLICY IF EXISTS "Participants can send dispute messages" ON public.dispute_messages;

        -- If dispute_id exists but chat_id doesn't, rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispute_messages' AND column_name = 'dispute_id') 
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispute_messages' AND column_name = 'chat_id') THEN
            ALTER TABLE public.dispute_messages RENAME COLUMN dispute_id TO chat_id;
        END IF;

        -- If content_message exists but content doesn't, rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispute_messages' AND column_name = 'content_message') 
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispute_messages' AND column_name = 'content') THEN
            ALTER TABLE public.dispute_messages RENAME COLUMN content_message TO content;
        END IF;

        -- Ensure chat_id is UUID (Legacy might be using different types)
        ALTER TABLE public.dispute_messages ALTER COLUMN chat_id TYPE UUID USING chat_id::UUID;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dispute_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.dispute_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already there but incomplete
ALTER TABLE public.dispute_messages ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES public.dispute_chats(id) ON DELETE CASCADE;
ALTER TABLE public.dispute_messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.dispute_messages ADD COLUMN IF NOT EXISTS content TEXT;

-- Enable RLS
ALTER TABLE public.dispute_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Dispute Chats
DROP POLICY IF EXISTS "Participants can view dispute chats" ON public.dispute_chats;
CREATE POLICY "Participants can view dispute chats" ON public.dispute_chats FOR SELECT
USING (
    auth.uid() = dispute_chats.buyer_id OR 
    auth.uid() = dispute_chats.seller_id OR 
    auth.uid() = dispute_chats.admin_id OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Policies for Dispute Messages
DROP POLICY IF EXISTS "Participants can view dispute messages" ON public.dispute_messages;
CREATE POLICY "Participants can view dispute messages" ON public.dispute_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM dispute_chats dc
        WHERE dc.id = chat_id 
        AND (dc.buyer_id = auth.uid() OR dc.seller_id = auth.uid() OR dc.admin_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    )
);

DROP POLICY IF EXISTS "Participants can send dispute messages" ON public.dispute_messages;
CREATE POLICY "Participants can send dispute messages" ON public.dispute_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM dispute_chats dc
        WHERE dc.id = chat_id 
        AND (dc.buyer_id = auth.uid() OR dc.seller_id = auth.uid() OR dc.admin_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    )
);

-- 4. RPC: Raise Dispute with Chat
DROP FUNCTION IF EXISTS public.raise_dispute_v4(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.raise_dispute_v4(
    p_order_id UUID,
    p_reason TEXT
) RETURNS UUID AS $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
    v_admin_id UUID;
    v_chat_id UUID;
    v_dispute_id UUID;
BEGIN
    -- Get IDs
    SELECT buyer_id, seller_id INTO v_buyer_id, v_seller_id 
    FROM marketplace_orders WHERE id = p_order_id;

    IF auth.uid() != v_buyer_id THEN
        RAISE EXCEPTION 'Only the buyer can raise a dispute';
    END IF;

    -- Assign first available admin
    SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

    -- Create Dispute
    INSERT INTO public.marketplace_disputes (order_id, raised_by, reason, status)
    VALUES (p_order_id, v_buyer_id, p_reason, 'open')
    RETURNING id INTO v_dispute_id;

    -- Update Order
    UPDATE marketplace_orders 
    SET status = 'disputed', disputed_at = NOW() 
    WHERE id = p_order_id;

    -- Create Chat
    INSERT INTO public.dispute_chats (order_id, buyer_id, seller_id, admin_id, last_message)
    VALUES (p_order_id, v_buyer_id, v_seller_id, v_admin_id, 'Dispute opened: ' || p_reason)
    RETURNING id INTO v_chat_id;

    -- Initial System Message
    INSERT INTO public.dispute_messages (chat_id, sender_id, content)
    VALUES (v_chat_id, v_admin_id, 'System: A dispute has been raised for this order. An admin will mediate shortly. Order Details: ' || p_order_id);

    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Admin Resolve Dispute
DROP FUNCTION IF EXISTS public.admin_resolve_dispute(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_resolve_dispute(
    p_order_id UUID,
    p_resolution TEXT, -- 'refund' or 'release'
    p_notes TEXT
) RETURNS VOID AS $$
DECLARE
    v_ord RECORD;
BEGIN
    -- Security Check
    IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Only admins can resolve disputes';
    END IF;

    SELECT * INTO v_ord FROM marketplace_orders WHERE id = p_order_id;

    IF v_resolution = 'refund' THEN
        -- Refund to Buyer Wallet
        UPDATE profiles SET wallet_balance = wallet_balance + v_ord.amount WHERE id = v_ord.buyer_id;
        
        -- Create Transaction
        INSERT INTO payment_transactions (user_id, amount, type, status, description, reference_id, category)
        VALUES (v_ord.buyer_id, v_ord.amount, 'refund', 'completed', 'Refund for Disputed Order #' || substring(p_order_id::text, 1, 8), p_order_id::text, 'marketplace');

        UPDATE marketplace_orders SET status = 'cancelled', resolved_at = NOW() WHERE id = p_order_id;
    ELSIF v_resolution = 'release' THEN
        -- Release to Seller (Apply 48h hold by putting in pending_balance)
        UPDATE profiles SET pending_balance = pending_balance + v_ord.amount WHERE id = v_ord.seller_id;
        
        -- Create Transaction (Pending)
        INSERT INTO payment_transactions (user_id, amount, type, status, description, reference_id, category)
        VALUES (v_ord.seller_id, v_ord.amount, 'sale_credit', 'pending', 'Funds Released (48h Hold) for Order #' || substring(p_order_id::text, 1, 8), p_order_id::text, 'marketplace');

        UPDATE marketplace_orders SET status = 'completed', funds_released = TRUE, resolved_at = NOW() WHERE id = p_order_id;
    END IF;

    -- Close Dispute
    UPDATE marketplace_disputes 
    SET status = CASE WHEN p_resolution = 'refund' THEN 'resolved_refund' ELSE 'resolved_seller' END,
        admin_notes = p_notes,
        resolved_at = NOW()
    WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update Standard release_funds for 48h hold
DROP FUNCTION IF EXISTS public.release_funds(UUID);
CREATE OR REPLACE FUNCTION public.release_funds(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_ord RECORD;
BEGIN
    SELECT * INTO v_ord FROM marketplace_orders WHERE id = p_order_id;
    
    IF v_ord IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_ord.funds_released THEN
         RAISE EXCEPTION 'Funds already released';
    END IF;

    -- Update Order
    UPDATE marketplace_orders 
    SET status = 'completed', funds_released = TRUE, resolved_at = NOW() 
    WHERE id = p_order_id;

    -- Credit Seller PENDING balance (48h hold)
    UPDATE profiles 
    SET pending_balance = pending_balance + v_ord.amount 
    WHERE id = v_ord.seller_id;

    -- Create Transaction Record (Pending)
    INSERT INTO payment_transactions (
        user_id, 
        amount, 
        type, 
        status, 
        description, 
        reference_id, 
        category 
    )
    VALUES (
        v_ord.seller_id, 
        v_ord.amount, 
        'sale_credit', 
        'pending', 
        'Funds Released (48h Hold) for Order #' || substring(p_order_id::text, 1, 8), 
        p_order_id::text, 
        'marketplace' 
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Process Escrow Payouts (Cron/Manual trigger)
-- This function moves funds from pending_balance to wallet_balance if 48h have passed since resolved_at
CREATE OR REPLACE FUNCTION public.process_escrow_payouts()
RETURNS VOID AS $$
DECLARE
    v_ord RECORD;
BEGIN
    FOR v_ord IN 
        SELECT id, seller_id, amount 
        FROM marketplace_orders 
        WHERE (status = 'completed' OR status = 'resolved_seller')
        AND funds_released = TRUE 
        AND resolved_at < NOW() - INTERVAL '48 hours'
        AND payout_completed = FALSE
    LOOP
        -- Move funds
        UPDATE profiles SET 
            pending_balance = pending_balance - v_ord.amount,
            wallet_balance = wallet_balance + v_ord.amount
        WHERE id = v_ord.seller_id;

        -- Mark Order as Payout Completed
        UPDATE marketplace_orders SET payout_completed = TRUE WHERE id = v_ord.id;

        -- Update Transaction Record to Completed
        UPDATE payment_transactions 
        SET status = 'completed', description = 'Payout Completed (Hold period ended) for Order #' || substring(v_ord.id::text, 1, 8)
        WHERE reference_id = v_ord.id::text AND type = 'sale_credit';
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Process Marketplace Purchase (Buyer buys item)
DROP FUNCTION IF EXISTS public.process_marketplace_purchase(UUID);
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_item_id UUID)
RETURNS UUID AS $$
DECLARE
    v_item RECORD;
    v_buyer_id UUID;
    v_order_id UUID;
BEGIN
    -- Get current user
    v_buyer_id := auth.uid();
    
    -- Lock item for update
    SELECT * INTO v_item FROM marketplace_items WHERE id = p_item_id FOR UPDATE;
    
    IF v_item IS NULL THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    IF v_item.status != 'approved' THEN
        RAISE EXCEPTION 'Item is no longer available';
    END IF;

    IF v_item.seller_id = v_buyer_id THEN
        RAISE EXCEPTION 'You cannot buy your own item';
    END IF;

    -- Check Buyer Balance
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = v_buyer_id AND wallet_balance >= v_item.price
    ) THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Please add funds to your wallet first.';
    END IF;

    -- Deduct from Buyer
    UPDATE profiles 
    SET wallet_balance = wallet_balance - v_item.price 
    WHERE id = v_buyer_id;

    -- Update Item Status
    UPDATE marketplace_items 
    SET status = 'sold' 
    WHERE id = p_item_id;

    -- Create Order (Initial state: pending_delivery, funds in escrow)
    INSERT INTO marketplace_orders (
        item_id,
        buyer_id,
        seller_id,
        amount,
        status,
        paid_at
    )
    VALUES (
        p_item_id,
        v_buyer_id,
        v_item.seller_id,
        v_item.price,
        'pending_delivery',
        NOW()
    )
    RETURNING id INTO v_order_id;

    -- Log Transaction for Buyer
    INSERT INTO payment_transactions (
        user_id,
        amount,
        type,
        status,
        description,
        reference_id,
        category
    )
    VALUES (
        v_buyer_id,
        v_item.price,
        'purchase',
        'completed',
        'Purchase: ' || v_item.title,
        v_order_id::text,
        'marketplace'
    );

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
