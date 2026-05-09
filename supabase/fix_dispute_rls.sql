-- Enable Buyers to Raise Disputes
-- 1. Add INSERT policy for Disputes
DROP POLICY IF EXISTS "Users can create disputes" ON public.marketplace_disputes;

CREATE POLICY "Users can create disputes"
ON public.marketplace_disputes
FOR INSERT
WITH CHECK (auth.uid() = raised_by);

-- 2. Trigger to Auto-Update Order Status to 'disputed'
CREATE OR REPLACE FUNCTION public.handle_new_dispute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the order status to 'disputed' so funds are frozen
    UPDATE public.marketplace_orders
    SET status = 'disputed'
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_dispute_created ON public.marketplace_disputes;

CREATE TRIGGER on_dispute_created
AFTER INSERT ON public.marketplace_disputes
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_dispute();
