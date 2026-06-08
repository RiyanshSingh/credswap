-- RPC: Add Funds to Wallet (For development/demo purposes)
DROP FUNCTION IF EXISTS public.add_funds(p_amount DECIMAL);

CREATE OR REPLACE FUNCTION public.add_funds(p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    -- Update Profile Balance
    UPDATE public.profiles 
    SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount 
    WHERE id = auth.uid();

    -- Create Transaction Record
    INSERT INTO public.payment_transactions (
        user_id, 
        amount, 
        type, 
        status, 
        description, 
        category
    )
    VALUES (
        auth.uid(), 
        p_amount, 
        'deposit', 
        'completed', 
        'Wallet Top-up', 
        'marketplace'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
