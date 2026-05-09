-- Create table for storing Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subscription JSONB NOT NULL, -- Stores { endpoint, keys: { p256dh, auth } }
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subscription) -- Prevent duplicate subscriptions for same device user
);

-- RLS Policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own subscription
CREATE POLICY "Users can insert own subscription" ON public.push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscription (e.g. logout)
CREATE POLICY "Users can delete own subscription" ON public.push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Users can view their own
CREATE POLICY "Users can view own subscription" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all (for debugging)
CREATE POLICY "Admins can view all subscriptions" ON public.push_subscriptions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );
