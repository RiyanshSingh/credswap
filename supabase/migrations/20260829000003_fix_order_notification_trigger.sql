-- Fix the notification trigger that runs after a marketplace order is created.
-- The old function declared seller_id and then selected an unqualified seller_id,
-- which made PostgreSQL reject every marketplace purchase as ambiguous.

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
        'New Order Received',
        'Someone ordered your item: ' || v_item_title,
        'success',
        '/dashboard?tab=orders'
    );

    RETURN NEW;
END;
$function$;
