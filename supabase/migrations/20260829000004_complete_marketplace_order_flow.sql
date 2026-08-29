-- Complete the marketplace escrow workflow.
-- Every state transition is performed server-side and checks the authenticated
-- participant (or verified administrative credentials) before changing money or order state.

ALTER TABLE public.marketplace_orders
    ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
    ADD COLUMN IF NOT EXISTS buyer_confirmed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_disputes_one_open_order
    ON public.marketplace_disputes (order_id)
    WHERE status = 'open';

CREATE UNIQUE INDEX IF NOT EXISTS dispute_chats_one_per_order
    ON public.dispute_chats (order_id);

CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_item_title text;
    v_seller_id uuid;
BEGIN
    SELECT mi.title, mi.seller_id
    INTO v_item_title, v_seller_id
    FROM public.marketplace_items AS mi
    WHERE mi.id = NEW.item_id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        v_seller_id,
        'New order — action needed',
        'Arrange delivery for ' || COALESCE(v_item_title, 'your marketplace item') || ', then mark it delivered.',
        'warning',
        '/dashboard?tab=sales'
    );

    RETURN NEW;
END;
$function$;

-- A single authorization rule shared by administrative workflow RPCs. Existing
-- profile admins continue to work; the legacy admin console is also checked
-- server-side against its credential store rather than trusting localStorage.
CREATE OR REPLACE FUNCTION public.marketplace_admin_authorized(
    p_username text DEFAULT NULL,
    p_password text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF public.is_admin() THEN
        RETURN true;
    END IF;

    RETURN p_username IS NOT NULL
       AND p_password IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM public.admin_credentials AS ac
           WHERE ac.username = p_username
             AND ac.password = p_password
       );
END;
$function$;

CREATE OR REPLACE FUNCTION public.seller_mark_order_delivered(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_order public.marketplace_orders%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be signed in to update an order.';
    END IF;

    SELECT * INTO v_order
    FROM public.marketplace_orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;
    IF v_order.seller_id <> auth.uid() THEN
        RAISE EXCEPTION 'Only the seller can mark this order delivered.';
    END IF;
    IF v_order.status <> 'pending_delivery' THEN
        RAISE EXCEPTION 'This order cannot be marked delivered from its current state.';
    END IF;

    UPDATE public.marketplace_orders
    SET status = 'delivered', delivered_at = now()
    WHERE id = v_order.id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        v_order.buyer_id,
        'Seller marked your order delivered',
        'Please confirm receipt when you have the item, or report an issue so funds remain protected.',
        'info',
        '/dashboard?tab=orders'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.buyer_confirm_order_delivery(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_order public.marketplace_orders%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be signed in to confirm delivery.';
    END IF;

    SELECT * INTO v_order
    FROM public.marketplace_orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;
    IF v_order.buyer_id <> auth.uid() THEN
        RAISE EXCEPTION 'Only the buyer can confirm receipt for this order.';
    END IF;
    IF v_order.status <> 'delivered' OR COALESCE(v_order.funds_released, false) THEN
        RAISE EXCEPTION 'This order is not awaiting buyer confirmation.';
    END IF;

    UPDATE public.marketplace_orders
    SET status = 'completed',
        funds_released = true,
        buyer_confirmed_at = now(),
        resolved_at = now()
    WHERE id = v_order.id;

    UPDATE public.profiles
    SET pending_balance = COALESCE(pending_balance, 0) + v_order.amount
    WHERE id = v_order.seller_id;

    INSERT INTO public.payment_transactions (user_id, amount, type, status, description, reference_id, category)
    VALUES (
        v_order.seller_id,
        v_order.amount,
        'sale_credit',
        'pending',
        'Buyer confirmed receipt — 48 hour payout hold for order #' || left(v_order.id::text, 8),
        v_order.id::text,
        'marketplace'
    );

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES
        (v_order.seller_id, 'Order completed', 'The buyer confirmed receipt. Your payout is now in the standard 48-hour hold.', 'success', '/dashboard?tab=sales'),
        (v_order.buyer_id, 'Receipt confirmed', 'Your order is complete and the seller payout has entered its protected hold.', 'success', '/dashboard?tab=orders');
END;
$function$;

-- Preserve older clients while closing the previous authorization gap.
CREATE OR REPLACE FUNCTION public.release_funds(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    PERFORM public.buyer_confirm_order_delivery(p_order_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.raise_marketplace_dispute(
    p_order_id uuid,
    p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_order public.marketplace_orders%ROWTYPE;
    v_dispute_id uuid;
    v_chat_id uuid;
    v_admin_id uuid;
    v_reason text := btrim(COALESCE(p_reason, ''));
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be signed in to open a dispute.';
    END IF;
    IF length(v_reason) < 3 OR length(v_reason) > 2000 THEN
        RAISE EXCEPTION 'Please provide a dispute reason between 3 and 2000 characters.';
    END IF;

    SELECT * INTO v_order
    FROM public.marketplace_orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;
    IF auth.uid() <> v_order.buyer_id AND auth.uid() <> v_order.seller_id THEN
        RAISE EXCEPTION 'Only the buyer or seller can open a dispute for this order.';
    END IF;
    IF v_order.status NOT IN ('pending_delivery', 'delivered') THEN
        RAISE EXCEPTION 'A dispute can only be opened while delivery is in progress.';
    END IF;

    SELECT p.id INTO v_admin_id
    FROM public.profiles AS p
    WHERE p.role = 'admin'
    ORDER BY p.created_at
    LIMIT 1;

    INSERT INTO public.marketplace_disputes (order_id, raised_by, reason, status)
    VALUES (v_order.id, auth.uid(), v_reason, 'open')
    RETURNING id INTO v_dispute_id;

    UPDATE public.marketplace_orders
    SET status = 'disputed', disputed_at = now()
    WHERE id = v_order.id;

    INSERT INTO public.dispute_chats (order_id, buyer_id, seller_id, admin_id, last_message, last_message_at)
    VALUES (v_order.id, v_order.buyer_id, v_order.seller_id, v_admin_id, v_reason, now())
    ON CONFLICT (order_id) DO UPDATE
        SET last_message = EXCLUDED.last_message,
            last_message_at = EXCLUDED.last_message_at
    RETURNING id INTO v_chat_id;

    INSERT INTO public.dispute_messages (chat_id, sender_id, content)
    VALUES (v_chat_id, auth.uid(), 'Dispute opened: ' || v_reason);

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES
        (CASE WHEN auth.uid() = v_order.buyer_id THEN v_order.seller_id ELSE v_order.buyer_id END,
         'Marketplace dispute opened',
         'An issue was reported for an order involving you. Open the secure dispute channel to respond.',
         'warning', '/dispute/' || v_dispute_id::text),
        (auth.uid(), 'Dispute submitted', 'Funds remain protected while the dispute is reviewed.', 'info', '/dispute/' || v_dispute_id::text);

    IF v_admin_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (v_admin_id, 'New marketplace dispute', 'A marketplace dispute requires review.', 'warning', '/dispute/' || v_dispute_id::text);
    END IF;

    RETURN v_dispute_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'There is already an open dispute for this order.';
END;
$function$;

CREATE OR REPLACE FUNCTION public.post_marketplace_dispute_message(
    p_dispute_id uuid,
    p_content text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_dispute public.marketplace_disputes%ROWTYPE;
    v_order public.marketplace_orders%ROWTYPE;
    v_chat_id uuid;
    v_content text := btrim(COALESCE(p_content, ''));
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be signed in to send a message.';
    END IF;
    IF length(v_content) < 1 OR length(v_content) > 2000 THEN
        RAISE EXCEPTION 'Messages must be between 1 and 2000 characters.';
    END IF;

    SELECT * INTO v_dispute FROM public.marketplace_disputes WHERE id = p_dispute_id FOR UPDATE;
    IF NOT FOUND OR v_dispute.status <> 'open' THEN
        RAISE EXCEPTION 'This dispute is closed or unavailable.';
    END IF;
    SELECT * INTO v_order FROM public.marketplace_orders WHERE id = v_dispute.order_id;
    IF auth.uid() <> v_order.buyer_id AND auth.uid() <> v_order.seller_id THEN
        RAISE EXCEPTION 'Only the buyer or seller can post in this dispute.';
    END IF;

    SELECT id INTO v_chat_id FROM public.dispute_chats WHERE order_id = v_order.id;
    IF v_chat_id IS NULL THEN
        RAISE EXCEPTION 'The dispute channel is unavailable.';
    END IF;

    INSERT INTO public.dispute_messages (chat_id, sender_id, content)
    VALUES (v_chat_id, auth.uid(), v_content);
    UPDATE public.dispute_chats SET last_message = v_content, last_message_at = now() WHERE id = v_chat_id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        CASE WHEN auth.uid() = v_order.buyer_id THEN v_order.seller_id ELSE v_order.buyer_id END,
        'New dispute message',
        'There is a new message in your marketplace dispute.',
        'info', '/dispute/' || v_dispute.id::text
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_marketplace_dispute(
    p_dispute_id uuid,
    p_resolution text,
    p_notes text DEFAULT NULL,
    p_username text DEFAULT NULL,
    p_password text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_dispute public.marketplace_disputes%ROWTYPE;
    v_order public.marketplace_orders%ROWTYPE;
    v_notes text := NULLIF(btrim(COALESCE(p_notes, '')), '');
BEGIN
    IF NOT public.marketplace_admin_authorized(p_username, p_password) THEN
        RAISE EXCEPTION 'Administrative authorization is required.';
    END IF;
    IF p_resolution NOT IN ('refund', 'release') THEN
        RAISE EXCEPTION 'Resolution must be refund or release.';
    END IF;

    SELECT * INTO v_dispute FROM public.marketplace_disputes WHERE id = p_dispute_id FOR UPDATE;
    IF NOT FOUND OR v_dispute.status <> 'open' THEN
        RAISE EXCEPTION 'This dispute has already been resolved or does not exist.';
    END IF;
    SELECT * INTO v_order FROM public.marketplace_orders WHERE id = v_dispute.order_id FOR UPDATE;
    IF NOT FOUND OR v_order.status <> 'disputed' THEN
        RAISE EXCEPTION 'The linked order is not awaiting dispute resolution.';
    END IF;

    IF p_resolution = 'refund' THEN
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_order.amount WHERE id = v_order.buyer_id;
        INSERT INTO public.payment_transactions (user_id, amount, type, status, description, reference_id, category)
        VALUES (v_order.buyer_id, v_order.amount, 'refund', 'completed', 'Marketplace dispute refund for order #' || left(v_order.id::text, 8), v_order.id::text, 'marketplace');
        UPDATE public.marketplace_orders SET status = 'cancelled', resolved_at = now() WHERE id = v_order.id;
        UPDATE public.marketplace_items SET status = 'approved' WHERE id = v_order.item_id;
    ELSE
        UPDATE public.profiles SET pending_balance = COALESCE(pending_balance, 0) + v_order.amount WHERE id = v_order.seller_id;
        INSERT INTO public.payment_transactions (user_id, amount, type, status, description, reference_id, category)
        VALUES (v_order.seller_id, v_order.amount, 'sale_credit', 'pending', 'Dispute resolved for seller — 48 hour payout hold for order #' || left(v_order.id::text, 8), v_order.id::text, 'marketplace');
        UPDATE public.marketplace_orders SET status = 'completed', funds_released = true, resolved_at = now() WHERE id = v_order.id;
    END IF;

    UPDATE public.marketplace_disputes
    SET status = CASE WHEN p_resolution = 'refund' THEN 'resolved_refund' ELSE 'resolved_seller' END,
        admin_notes = v_notes,
        resolved_at = now()
    WHERE id = v_dispute.id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES
        (v_order.buyer_id,
         CASE WHEN p_resolution = 'refund' THEN 'Dispute resolved — refund issued' ELSE 'Dispute resolved — seller payout approved' END,
         COALESCE(v_notes, 'The marketplace admin has resolved this dispute.'),
         CASE WHEN p_resolution = 'refund' THEN 'success' ELSE 'info' END,
         '/dashboard?tab=orders'),
        (v_order.seller_id,
         CASE WHEN p_resolution = 'release' THEN 'Dispute resolved — payout approved' ELSE 'Dispute resolved — buyer refunded' END,
         COALESCE(v_notes, 'The marketplace admin has resolved this dispute.'),
         CASE WHEN p_resolution = 'release' THEN 'success' ELSE 'info' END,
         '/dashboard?tab=sales');
END;
$function$;

-- Legacy name retained for integrations that still submit an order id.
CREATE OR REPLACE FUNCTION public.admin_resolve_dispute(
    p_order_id uuid,
    p_resolution text,
    p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_dispute_id uuid;
BEGIN
    SELECT id INTO v_dispute_id FROM public.marketplace_disputes WHERE order_id = p_order_id AND status = 'open';
    IF v_dispute_id IS NULL THEN RAISE EXCEPTION 'Open dispute not found for this order.'; END IF;
    PERFORM public.resolve_marketplace_dispute(v_dispute_id, p_resolution, p_notes);
END;
$function$;

-- The current administrative console uses a separate credential flow. These
-- narrowly scoped read/write RPCs let that console mediate disputes without
-- opening the dispute tables to every signed-in user.
ALTER TABLE public.dispute_messages ALTER COLUMN sender_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_list_marketplace_disputes(
    p_username text,
    p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NOT public.marketplace_admin_authorized(p_username, p_password) THEN
        RAISE EXCEPTION 'Administrative authorization is required.';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(
            to_jsonb(d) || jsonb_build_object(
                'order', jsonb_build_object(
                    'id', o.id,
                    'amount', o.amount,
                    'status', o.status,
                    'buyer', jsonb_build_object('id', b.id, 'full_name', b.full_name),
                    'seller', jsonb_build_object('id', s.id, 'full_name', s.full_name)
                )
            )
            ORDER BY d.created_at DESC
        )
        FROM public.marketplace_disputes AS d
        JOIN public.marketplace_orders AS o ON o.id = d.order_id
        LEFT JOIN public.profiles AS b ON b.id = o.buyer_id
        LEFT JOIN public.profiles AS s ON s.id = o.seller_id
    ), '[]'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_marketplace_dispute(
    p_dispute_id uuid,
    p_username text,
    p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_result jsonb;
BEGIN
    IF NOT public.marketplace_admin_authorized(p_username, p_password) THEN
        RAISE EXCEPTION 'Administrative authorization is required.';
    END IF;

    SELECT to_jsonb(d) || jsonb_build_object(
        'order', jsonb_build_object(
            'id', o.id,
            'amount', o.amount,
            'status', o.status,
            'item', jsonb_build_object('id', i.id, 'title', i.title, 'image_url', i.image_url),
            'buyer', jsonb_build_object('id', b.id, 'full_name', b.full_name),
            'seller', jsonb_build_object('id', s.id, 'full_name', s.full_name)
        ),
        'raised_by_profile', jsonb_build_object('id', r.id, 'full_name', r.full_name)
    )
    INTO v_result
    FROM public.marketplace_disputes AS d
    JOIN public.marketplace_orders AS o ON o.id = d.order_id
    LEFT JOIN public.marketplace_items AS i ON i.id = o.item_id
    LEFT JOIN public.profiles AS b ON b.id = o.buyer_id
    LEFT JOIN public.profiles AS s ON s.id = o.seller_id
    LEFT JOIN public.profiles AS r ON r.id = d.raised_by
    WHERE d.id = p_dispute_id;

    IF v_result IS NULL THEN RAISE EXCEPTION 'Dispute not found.'; END IF;
    RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_marketplace_dispute_messages(
    p_dispute_id uuid,
    p_username text,
    p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NOT public.marketplace_admin_authorized(p_username, p_password) THEN
        RAISE EXCEPTION 'Administrative authorization is required.';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', m.id,
                'chat_id', m.chat_id,
                'sender_id', m.sender_id,
                'content', m.content,
                'created_at', m.created_at,
                'sender', CASE WHEN m.sender_id IS NULL
                    THEN jsonb_build_object('full_name', 'Platform Admin', 'role', 'admin')
                    ELSE jsonb_build_object('full_name', p.full_name, 'role', p.role)
                END
            ) ORDER BY m.created_at
        )
        FROM public.dispute_messages AS m
        JOIN public.dispute_chats AS c ON c.id = m.chat_id
        LEFT JOIN public.profiles AS p ON p.id = m.sender_id
        WHERE c.order_id = (SELECT order_id FROM public.marketplace_disputes WHERE id = p_dispute_id)
    ), '[]'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_post_marketplace_dispute_message(
    p_dispute_id uuid,
    p_content text,
    p_username text,
    p_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_dispute public.marketplace_disputes%ROWTYPE;
    v_order public.marketplace_orders%ROWTYPE;
    v_chat_id uuid;
    v_content text := btrim(COALESCE(p_content, ''));
BEGIN
    IF NOT public.marketplace_admin_authorized(p_username, p_password) THEN
        RAISE EXCEPTION 'Administrative authorization is required.';
    END IF;
    IF length(v_content) < 1 OR length(v_content) > 2000 THEN
        RAISE EXCEPTION 'Messages must be between 1 and 2000 characters.';
    END IF;

    SELECT * INTO v_dispute FROM public.marketplace_disputes WHERE id = p_dispute_id FOR UPDATE;
    IF NOT FOUND OR v_dispute.status <> 'open' THEN RAISE EXCEPTION 'This dispute is closed or unavailable.'; END IF;
    SELECT * INTO v_order FROM public.marketplace_orders WHERE id = v_dispute.order_id;
    SELECT id INTO v_chat_id FROM public.dispute_chats WHERE order_id = v_order.id;
    IF v_chat_id IS NULL THEN RAISE EXCEPTION 'The dispute channel is unavailable.'; END IF;

    INSERT INTO public.dispute_messages (chat_id, sender_id, content)
    VALUES (v_chat_id, NULL, v_content);
    UPDATE public.dispute_chats SET last_message = v_content, last_message_at = now() WHERE id = v_chat_id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES
        (v_order.buyer_id, 'Admin replied to your dispute', 'There is a new message in your marketplace dispute.', 'info', '/dispute/' || v_dispute.id::text),
        (v_order.seller_id, 'Admin replied to your dispute', 'There is a new message in your marketplace dispute.', 'info', '/dispute/' || v_dispute.id::text);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.seller_mark_order_delivered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buyer_confirm_order_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_funds(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.raise_marketplace_dispute(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_marketplace_dispute_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_marketplace_dispute(uuid, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_marketplace_disputes(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_marketplace_dispute(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_marketplace_dispute_messages(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_post_marketplace_dispute_message(uuid, text, text, text) TO anon, authenticated;
