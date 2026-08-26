-- XUM AI withdrawal verification
-- Version: 1.0
-- The raw code is generated and delivered by the request-withdrawal Edge Function.
-- Only its SHA-256 digest is stored in this database.

-- Keep the database contract aligned with the contributor wallet methods.
ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS valid_method;
ALTER TABLE public.withdrawals
    ADD CONSTRAINT valid_method CHECK (method IN ('paypal', 'bank_transfer', 'mobile_money', 'crypto_usdc', 'crypto_usdt'));

CREATE TABLE IF NOT EXISTS public.withdrawal_otp_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_id UUID NOT NULL UNIQUE REFERENCES public.withdrawals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL CHECK (code_hash ~ '^[0-9a-f]{64}$'),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_otp_user ON public.withdrawal_otp_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_otp_expiry ON public.withdrawal_otp_challenges(expires_at)
    WHERE verified_at IS NULL;

ALTER TABLE public.withdrawal_otp_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.withdrawal_otp_challenges FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.constant_time_text_equal(p_left TEXT, p_right TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_difference INTEGER := 0;
    v_index INTEGER;
BEGIN
    IF p_left IS NULL OR p_right IS NULL OR length(p_left) <> length(p_right) THEN
        RETURN FALSE;
    END IF;

    FOR v_index IN 1..length(p_left) LOOP
        v_difference := v_difference | (ascii(substr(p_left, v_index, 1)) # ascii(substr(p_right, v_index, 1)));
    END LOOP;

    RETURN v_difference = 0;
END;
$$;

-- This is the only client-callable withdrawal request RPC. It keeps challenge
-- creation in the same transaction as balance escrow and the withdrawal row.
CREATE OR REPLACE FUNCTION public.request_withdrawal_with_otp(
    p_user_id UUID,
    p_amount DECIMAL,
    p_method VARCHAR,
    p_account_details JSONB,
    p_code_hash TEXT,
    p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_withdrawal_id UUID;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_user_id AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized withdrawal request.';
    END IF;

    IF p_code_hash IS NULL OR p_code_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'Invalid withdrawal verification challenge.';
    END IF;

    IF p_expires_at IS NULL OR p_expires_at <= now() OR p_expires_at > now() + INTERVAL '15 minutes' THEN
        RAISE EXCEPTION 'Invalid withdrawal verification expiry.';
    END IF;

    v_withdrawal_id := public.request_withdrawal(
        p_user_id,
        p_amount,
        p_method,
        p_account_details
    );

    INSERT INTO public.withdrawal_otp_challenges (
        withdrawal_id,
        user_id,
        code_hash,
        expires_at
    ) VALUES (
        v_withdrawal_id,
        p_user_id,
        p_code_hash,
        p_expires_at
    );

    RETURN v_withdrawal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_withdrawal_otp(
    p_user_id UUID,
    p_withdrawal_id UUID,
    p_otp TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_challenge public.withdrawal_otp_challenges%ROWTYPE;
    v_withdrawal public.withdrawals%ROWTYPE;
    v_computed_hash TEXT;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_user_id AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized withdrawal verification.';
    END IF;

    SELECT * INTO v_withdrawal
    FROM public.withdrawals
    WHERE id = p_withdrawal_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND OR v_withdrawal.status <> 'pending' THEN
        RAISE EXCEPTION 'Withdrawal is not awaiting verification.';
    END IF;

    SELECT * INTO v_challenge
    FROM public.withdrawal_otp_challenges
    WHERE withdrawal_id = p_withdrawal_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND OR v_challenge.verified_at IS NOT NULL THEN
        RAISE EXCEPTION 'Verification challenge is unavailable.';
    END IF;

    IF v_challenge.attempts >= v_challenge.max_attempts THEN
        RAISE EXCEPTION 'Too many verification attempts.';
    END IF;

    IF v_challenge.expires_at <= now() THEN
        RAISE EXCEPTION 'Verification code has expired.';
    END IF;

    v_computed_hash := encode(digest(COALESCE(p_otp, ''), 'sha256'), 'hex');
    IF NOT public.constant_time_text_equal(v_computed_hash, v_challenge.code_hash) THEN
        UPDATE public.withdrawal_otp_challenges
        SET attempts = attempts + 1
        WHERE id = v_challenge.id;
        RAISE EXCEPTION 'Invalid verification code.';
    END IF;

    UPDATE public.withdrawal_otp_challenges
    SET verified_at = now()
    WHERE id = v_challenge.id;

    UPDATE public.withdrawals
    SET status = 'processing'
    WHERE id = p_withdrawal_id AND status = 'pending';

    RETURN TRUE;
END;
$$;

-- Used only if the delivery provider rejects the message after the escrow
-- transaction succeeds. It restores the exact balance and creates a ledger row.
CREATE OR REPLACE FUNCTION public.cancel_unverified_withdrawal(
    p_user_id UUID,
    p_withdrawal_id UUID,
    p_reason TEXT DEFAULT 'Verification delivery failed'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_withdrawal public.withdrawals%ROWTYPE;
    v_new_balance DECIMAL;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_user_id AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized withdrawal cancellation.';
    END IF;

    SELECT w.* INTO v_withdrawal
    FROM public.withdrawals w
    JOIN public.withdrawal_otp_challenges c ON c.withdrawal_id = w.id
    WHERE w.id = p_withdrawal_id
      AND w.user_id = p_user_id
      AND w.status = 'pending'
      AND c.verified_at IS NULL
    FOR UPDATE OF w;

    IF NOT FOUND THEN RETURN FALSE; END IF;

    UPDATE public.withdrawals
    SET status = 'cancelled', rejection_reason = left(COALESCE(p_reason, 'Verification delivery failed'), 500), processed_at = now()
    WHERE id = v_withdrawal.id;

    UPDATE public.users
    SET balance = balance + v_withdrawal.amount,
        total_withdrawn = GREATEST(0, total_withdrawn - v_withdrawal.amount),
        updated_at = now()
    WHERE id = p_user_id
    RETURNING balance INTO v_new_balance;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, withdrawal_id, description)
    VALUES (p_user_id, 'refund', v_withdrawal.amount, v_new_balance, v_withdrawal.id, 'Refunded unverified withdrawal');

    RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.constant_time_text_equal(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive_data(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive_data(BYTEA, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(UUID, DECIMAL, VARCHAR, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal_with_otp(UUID, DECIMAL, VARCHAR, JSONB, TEXT, TIMESTAMP WITH TIME ZONE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_withdrawal_otp(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_unverified_withdrawal(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_withdrawal_with_otp(UUID, DECIMAL, VARCHAR, JSONB, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_withdrawal_otp(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_unverified_withdrawal(UUID, UUID, TEXT) TO authenticated, service_role;

COMMENT ON TABLE public.withdrawal_otp_challenges IS 'One-time withdrawal challenges; raw codes are never stored.';
