-- ============================================================
-- XUM AI — Referral System (functional loop)
-- Run in Supabase SQL Editor. Idempotent & safe to re-run.
--
-- This reconciles the two historical `referrals` schemas, adds a
-- secure RPC that records a referral at sign-up (bypassing the
-- referrer-only INSERT policy), and pays the referrer + milestone
-- bonuses when the referred user completes their first task.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Reconcile the referrals table
--    (screen + migrations.sql use reward_amount/paid_out;
--     08_prd_features.sql used status/bounty_paid — keep both)
-- ------------------------------------------------------------
-- Columns are typed to match the live schema, where users.id holds Clerk
-- string ids (TEXT). If the table already exists this CREATE is a no-op and
-- the existing column types are preserved.
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id TEXT,
    referred_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referrals
    ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(10,2) DEFAULT 2.00,
    ADD COLUMN IF NOT EXISTS paid_out BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- A user may only be referred once. Use a unique index so the
-- apply_referral RPC can rely on ON CONFLICT (referred_id).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- Ensure FK relationships exist so PostgREST can embed the referred user
-- (ReferralsScreen selects `referred:referred_id(...)`). Best-effort: skip
-- if the constraint exists or column types don't line up with users.id.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referred_id_fkey'
    ) THEN
        ALTER TABLE public.referrals
            ADD CONSTRAINT referrals_referred_id_fkey
            FOREIGN KEY (referred_id) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipped referred_id FK: %', SQLERRM;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referrer_id_fkey'
    ) THEN
        ALTER TABLE public.referrals
            ADD CONSTRAINT referrals_referrer_id_fkey
            FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipped referrer_id FK: %', SQLERRM;
END $$;

-- ------------------------------------------------------------
-- 2. Allow the 'referral' transaction type (client enum expects it).
--    Permissive superset so existing rows never fail validation.
-- ------------------------------------------------------------
DO $$
BEGIN
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS valid_type;
    ALTER TABLE public.transactions ADD CONSTRAINT valid_type
        CHECK (type IN (
            'earning', 'earn', 'withdrawal', 'withdraw',
            'bonus', 'penalty', 'refund', 'referral'
        ));
EXCEPTION WHEN others THEN
    -- If a transactions table variant makes this impossible, skip
    -- rather than abort the whole migration.
    RAISE NOTICE 'Skipped transactions.valid_type update: %', SQLERRM;
END $$;

-- ------------------------------------------------------------
-- 3. apply_referral(): record a referral for the signing-up user.
--    SECURITY DEFINER so the *referred* user can create the row
--    (RLS only lets the referrer INSERT). Resolves the referrer
--    from the shared referral-code format: 'XUM-' + last 8 chars
--    of the user id (dashes stripped, uppercased).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_referral(
    p_code text,
    p_referred_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referred text;
    v_referrer text;
    v_suffix   text;
BEGIN
    -- Prefer the authenticated user; fall back to the passed id
    -- (session may not be attached yet during first-sync).
    v_referred := COALESCE(NULLIF(auth.uid()::text, ''), p_referred_id);
    IF v_referred IS NULL OR v_referred = '' THEN
        RETURN jsonb_build_object('status', 'error', 'reason', 'no_user');
    END IF;

    -- Idempotent: a user can only ever be referred once.
    IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id::text = v_referred) THEN
        RETURN jsonb_build_object('status', 'skipped', 'reason', 'already_referred');
    END IF;

    -- Normalize the code to its 8-char suffix. Stripping non-alnum
    -- drops the 'XUM-' prefix and any pasted URL punctuation; the
    -- meaningful part is always the trailing 8 chars.
    v_suffix := upper(right(regexp_replace(COALESCE(p_code, ''), '[^a-zA-Z0-9]', '', 'g'), 8));
    IF length(v_suffix) < 8 THEN
        RETURN jsonb_build_object('status', 'error', 'reason', 'bad_code');
    END IF;

    -- Resolve the referrer by the same derivation the app uses:
    -- strip non-alphanumerics, take the last 8 chars, uppercase.
    SELECT id::text INTO v_referrer
    FROM public.users
    WHERE upper(right(regexp_replace(id::text, '[^a-zA-Z0-9]', '', 'g'), 8)) = v_suffix
      AND id::text <> v_referred
    LIMIT 1;

    IF v_referrer IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'reason', 'referrer_not_found');
    END IF;

    -- No explicit ::uuid cast: users.id stores Clerk string ids (TEXT) in
    -- the live DB. Assignment coercion handles TEXT or UUID column types.
    INSERT INTO public.referrals (referrer_id, referred_id, reward_amount, paid_out, status)
    VALUES (v_referrer, v_referred, 2.00, false, 'pending')
    ON CONFLICT (referred_id) DO NOTHING;

    RETURN jsonb_build_object('status', 'ok', 'referrer_id', v_referrer);
EXCEPTION WHEN others THEN
    -- Never let a referral failure break the sign-up flow.
    RETURN jsonb_build_object('status', 'error', 'reason', SQLERRM);
END $$;

GRANT EXECUTE ON FUNCTION public.apply_referral(text, text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 4. Pay the referrer when the referred user is "activated"
--    (their first approved submission), plus milestone bonuses.
--    Supersedes the old release_referral_bounty trigger.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ref           public.referrals%ROWTYPE;
    v_new_balance   numeric;
    v_success_count int;
    v_bonus         numeric := 0;
BEGIN
    -- Only fire on the referred user's FIRST approved submission.
    IF (SELECT count(*) FROM public.submissions
        WHERE user_id = NEW.user_id AND status = 'approved') <> 1 THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_ref
    FROM public.referrals
    WHERE referred_id = NEW.user_id AND paid_out = false
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- 4a. Base referral reward
    UPDATE public.users
    SET balance = COALESCE(balance, 0) + v_ref.reward_amount,
        total_earned = COALESCE(total_earned, 0) + v_ref.reward_amount
    WHERE id = v_ref.referrer_id
    RETURNING balance INTO v_new_balance;

    UPDATE public.referrals
    SET paid_out = true, status = 'successful'
    WHERE id = v_ref.id;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
    VALUES (v_ref.referrer_id, 'referral', v_ref.reward_amount, COALESCE(v_new_balance, 0),
            'Referral reward — your invite completed their first task');

    -- 4b. Milestone bonuses (thresholds match ReferralsScreen)
    SELECT count(*) INTO v_success_count
    FROM public.referrals
    WHERE referrer_id = v_ref.referrer_id AND status = 'successful';

    v_bonus := CASE v_success_count
        WHEN 5  THEN 10.00
        WHEN 10 THEN 25.00
        WHEN 25 THEN 75.00
        WHEN 50 THEN 200.00
        ELSE 0
    END;

    IF v_bonus > 0 THEN
        UPDATE public.users
        SET balance = COALESCE(balance, 0) + v_bonus,
            total_earned = COALESCE(total_earned, 0) + v_bonus
        WHERE id = v_ref.referrer_id
        RETURNING balance INTO v_new_balance;

        INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
        VALUES (v_ref.referrer_id, 'bonus', v_bonus, COALESCE(v_new_balance, 0),
                format('Referral milestone bonus — %s successful referrals', v_success_count));
    END IF;

    RETURN NEW;
END $$;

-- Remove the legacy trigger so referrers aren't credited twice.
DROP TRIGGER IF EXISTS check_referral_completion ON public.submissions;
DROP TRIGGER IF EXISTS credit_referral_reward_trg ON public.submissions;
CREATE TRIGGER credit_referral_reward_trg
    AFTER UPDATE OF status ON public.submissions
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION public.credit_referral_reward();
