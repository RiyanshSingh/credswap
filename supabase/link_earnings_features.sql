-- Link Earnings & Wallet to Marketplace and Tasks
-- 1. Buying items deducts from Wallet.
-- 2. Completing tasks adds to Wallet.

-- PART 1: UPDATE BUYING LOGIC (Deduct Balance)
-- Overrides the previous function to add Balance Check & Deduction
CREATE OR REPLACE FUNCTION public.create_marketplace_order(item_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record RECORD;
    new_order_id UUID;
    user_balance NUMERIC;
BEGIN
    -- Get item details and lock row
    SELECT * INTO item_record FROM marketplace_items WHERE id = item_id FOR UPDATE;

    -- Check if item is valid
    IF item_record.status != 'approved' THEN
        RAISE EXCEPTION 'Item is not available for purchase';
    END IF;

    -- CHECK BALANCE (Use user_earnings as truth, but we sync profiles too)
    SELECT withdrawable_balance INTO user_balance FROM public.user_earnings WHERE user_id = auth.uid();
    
    -- If no record in earnings yet, try profiles (fallback/init)
    IF user_balance IS NULL THEN
        SELECT wallet_balance INTO user_balance FROM public.profiles WHERE id = auth.uid();
    END IF;
    
    IF COALESCE(user_balance, 0) < item_record.price THEN
        RAISE EXCEPTION 'Insufficient Funds. Please complete tasks to earn more money.';
    END IF;

    -- DEDUCT FUNDS
    -- Update User Earnings
    UPDATE public.user_earnings
    SET withdrawable_balance = withdrawable_balance - item_record.price
    WHERE user_id = auth.uid();

    -- Update Profiles (Sync)
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) - item_record.price
    WHERE id = auth.uid();


    -- Create Order
    INSERT INTO marketplace_orders (item_id, buyer_id, seller_id, amount, status)
    VALUES (item_id, auth.uid(), item_record.seller_id, item_record.price, 'paid_escrow')
    RETURNING id INTO new_order_id;

    -- Mark Item as Reserved
    UPDATE marketplace_items SET status = 'reserved' WHERE id = item_id;

    -- Sync Earnings for Seller (+Pending)
    INSERT INTO public.user_earnings (user_id, pending_amount)
    VALUES (item_record.seller_id, item_record.price)
    ON CONFLICT (user_id) 
    DO UPDATE SET pending_amount = user_earnings.pending_amount + item_record.price;

    -- LOG TRANSACTION: DEBIT BUYER
    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (
        auth.uid(), 
        item_record.price, 
        'debit', 
        'purchase', 
        'completed', 
        'Purchase of ' || item_record.title, 
        new_order_id
    );

    RETURN new_order_id;
END;
$$;


-- PART 2: CREATE TASK APPROVAL LOGIC (Add Earnings)
CREATE OR REPLACE FUNCTION public.approve_task_submission(submission_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sub_record RECORD;
    task_record RECORD;
BEGIN
    -- Get Submission
    SELECT * INTO sub_record FROM public.task_submissions WHERE id = submission_id FOR UPDATE;
    
    IF sub_record.status = 'approved' THEN
        RAISE EXCEPTION 'Submission already approved';
    END IF;

    -- Get Task Reward
    SELECT * INTO task_record FROM public.tasks WHERE id = sub_record.task_id;

    -- Update Submission Status
    UPDATE public.task_submissions SET status = 'approved' WHERE id = submission_id;

    -- ADD FUNDS TO USER
    -- Update User Earnings (+Total, +Withdrawable)
    INSERT INTO public.user_earnings (user_id, total_earned, withdrawable_balance)
    VALUES (sub_record.user_id, task_record.reward, task_record.reward)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_earned = user_earnings.total_earned + task_record.reward,
        withdrawable_balance = user_earnings.withdrawable_balance + task_record.reward;

    -- Update Profiles (Sync)
    UPDATE public.profiles
    SET 
        total_earned = COALESCE(total_earned, 0) + task_record.reward,
        wallet_balance = COALESCE(wallet_balance, 0) + task_record.reward
    WHERE id = sub_record.user_id;

    -- LOG TRANSACTION: CREDIT USER
    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (
        sub_record.user_id, 
        task_record.reward, 
        'credit', 
        'task_earning', 
        'completed', 
        'Reward for task: ' || task_record.title, 
        submission_id -- Linking to submission ID is safe if UUID
    );

END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_task_submission(uuid) TO authenticated;
