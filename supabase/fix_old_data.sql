-- Fix Historical Order Data
-- Old orders were already paid out but have 'funds_released' = FALSE (default)
-- and 'completed_at' = NULL (since column is new).
-- We mark them as released so they don't show up as "Pending" in the dashboard.

UPDATE public.marketplace_orders
SET funds_released = TRUE
WHERE status = 'completed' 
AND completed_at IS NULL;
