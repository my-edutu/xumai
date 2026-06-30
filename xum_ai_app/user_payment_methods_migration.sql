-- Create user_payment_methods table
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    provider_name TEXT,
    account_identifier TEXT,
    currency TEXT DEFAULT 'USD',
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create Security Policies
-- Allow users to view their own payment methods
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can view own payment methods" ON public.user_payment_methods
    FOR SELECT
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Allow users to add their own payment methods
DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can insert own payment methods" ON public.user_payment_methods
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Allow users to update their own payment methods
DROP POLICY IF EXISTS "Users can update own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can update own payment methods" ON public.user_payment_methods
    FOR UPDATE
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Allow users to delete their own payment methods
DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can delete own payment methods" ON public.user_payment_methods
    FOR DELETE
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));
