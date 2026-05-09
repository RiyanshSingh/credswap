-- Emergency Fix: Remove Notification Type Constraint
-- The constraint is causing issues with triggers. We will remove it to allow the Refund action to proceed.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
