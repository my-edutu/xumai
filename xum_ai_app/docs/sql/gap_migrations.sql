-- =============================================================================
-- XUM AI — Gap Fix Migrations
-- Run these in Supabase SQL Editor in order.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. MARKETPLACE DATASETS (Dataset Store — Gap 6)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketplace_datasets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    language        TEXT NOT NULL DEFAULT 'multilingual',
    task_type       TEXT NOT NULL,                   -- 'audio' | 'image' | 'text' | 'video' | 'validation'
    size_mb         NUMERIC(10, 2) DEFAULT 0,
    quality_score   INTEGER DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    price_usd       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    samples_count   INTEGER DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold_out', 'draft')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. DATASET PURCHASES (Dataset Store — Gap 6)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dataset_purchases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dataset_id      UUID NOT NULL REFERENCES marketplace_datasets(id) ON DELETE RESTRICT,
    price_paid      NUMERIC(10, 2) NOT NULL,
    purchased_at    TIMESTAMPTZ DEFAULT NOW(),
    download_url    TEXT,
    UNIQUE(user_id, dataset_id)
);

-- RPC: purchase_dataset
-- Deducts from user balance and inserts a dataset_purchase row.
CREATE OR REPLACE FUNCTION purchase_dataset(p_user_id TEXT, p_dataset_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_price     NUMERIC;
    v_balance   NUMERIC;
    v_purchase_id UUID;
BEGIN
    -- Get price
    SELECT price_usd INTO v_price FROM marketplace_datasets WHERE id = p_dataset_id AND status = 'available';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dataset not available for purchase.';
    END IF;

    -- Check balance
    SELECT balance INTO v_balance FROM users WHERE id = p_user_id;
    IF v_balance < v_price THEN
        RAISE EXCEPTION 'Insufficient balance. Required: $%, Available: $%', v_price, v_balance;
    END IF;

    -- Deduct balance
    UPDATE users SET balance = balance - v_price WHERE id = p_user_id;

    -- Insert purchase
    INSERT INTO dataset_purchases (user_id, dataset_id, price_paid)
    VALUES (p_user_id, p_dataset_id, v_price)
    RETURNING id INTO v_purchase_id;

    -- Record transaction
    INSERT INTO transactions (user_id, amount, type, description)
    VALUES (p_user_id, -v_price, 'withdraw', 'Dataset purchase: ' || p_dataset_id);

    RETURN v_purchase_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. SAFETY SCORES (XUM Judge Safety Scoring — Gap 7)
-- ---------------------------------------------------------------------------

-- Queue table (populated by admin or AI pipeline)
CREATE TABLE IF NOT EXISTS safety_review_queue (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt      TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    task_type   TEXT DEFAULT 'rlhf',
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'skipped')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Scores submitted by contributors
CREATE TABLE IF NOT EXISTS safety_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_id   UUID NOT NULL REFERENCES safety_review_queue(id) ON DELETE CASCADE,
    scores          JSONB NOT NULL DEFAULT '{}',
    -- scores shape: { "harmful_content": "yes"|"no"|"unsure", "misinformation": ..., "privacy_violation": ..., "bias_discrimination": ... }
    overall_score   INTEGER NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Credit reviewer $0.50 when safety_score is inserted
CREATE OR REPLACE FUNCTION credit_safety_reviewer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users SET balance = balance + 0.50, total_earned = total_earned + 0.50 WHERE id = NEW.user_id;
    INSERT INTO transactions (user_id, amount, type, description)
    VALUES (NEW.user_id, 0.50, 'earn', 'Safety scoring review');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_safety_reviewer ON safety_scores;
CREATE TRIGGER trg_credit_safety_reviewer
AFTER INSERT ON safety_scores
FOR EACH ROW EXECUTE FUNCTION credit_safety_reviewer();

-- ---------------------------------------------------------------------------
-- 4. CULTURAL SCORES (XUM Judge Cultural Review — Gap 7)
-- ---------------------------------------------------------------------------

-- Queue table
CREATE TABLE IF NOT EXISTS cultural_review_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content         TEXT NOT NULL,
    content_type    TEXT DEFAULT 'text',  -- 'text' | 'image_caption' | 'audio_transcript'
    target_region   TEXT,
    language        TEXT,
    context         TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'skipped')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Scores submitted by contributors
CREATE TABLE IF NOT EXISTS cultural_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id      UUID NOT NULL REFERENCES cultural_review_queue(id) ON DELETE CASCADE,
    region          TEXT,
    scores          JSONB NOT NULL DEFAULT '{}',
    -- scores shape: { "culturally_accurate": ..., "offensive_taboo": ..., "dialect_appropriate": ..., "represents_region": ... }
    overall_score   INTEGER NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Credit reviewer $0.75 on insert
CREATE OR REPLACE FUNCTION credit_cultural_reviewer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users SET balance = balance + 0.75, total_earned = total_earned + 0.75 WHERE id = NEW.user_id;
    INSERT INTO transactions (user_id, amount, type, description)
    VALUES (NEW.user_id, 0.75, 'earn', 'Cultural appropriateness review');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_cultural_reviewer ON cultural_scores;
CREATE TRIGGER trg_credit_cultural_reviewer
AFTER INSERT ON cultural_scores
FOR EACH ROW EXECUTE FUNCTION credit_cultural_reviewer();

-- ---------------------------------------------------------------------------
-- 5. AUDIT LOGS (Admin Audit Logs panel — Gap 5)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,           -- 'approve' | 'reject' | 'payout' | 'campaign' | 'suspend'
    target_type     TEXT NOT NULL,           -- 'submission' | 'withdrawal' | 'user' | 'task'
    target_id       TEXT NOT NULL,
    details         JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast admin-panel queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- 6. USERS TABLE — Add last_active_at column if missing (Admin Sessions panel)
-- ---------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Update last_active_at automatically on any user row update
CREATE OR REPLACE FUNCTION update_last_active_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_last_active ON users;
CREATE TRIGGER trg_update_last_active
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_last_active_at();

-- ---------------------------------------------------------------------------
-- 7. BOOST LANGUAGE REWARD RPC (Lexicon Orchestrator — Gap 5)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION boost_language_reward(p_language TEXT, p_multiplier NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update reward for tasks targeting this language
    UPDATE tasks
    SET reward = reward * p_multiplier
    WHERE metadata->>'language' = p_language
      AND status = 'active';
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. WITHDRAWALS — Add crypto_usdt as allowed method (Wallet — Gap 3)
-- ---------------------------------------------------------------------------
-- If you have a CHECK constraint on the method column, alter it:
-- ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_method_check;
-- ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_method_check
--     CHECK (method IN ('bank_transfer', 'paypal', 'mobile_money', 'crypto_usdt'));

-- =============================================================================
-- SEED: Sample marketplace datasets (optional, for testing)
-- =============================================================================
-- INSERT INTO marketplace_datasets (name, description, language, task_type, size_mb, quality_score, price_usd, samples_count, status) VALUES
-- ('Yoruba Voice Dataset v1', '5,000 clean Yoruba audio clips with transcripts', 'yo', 'audio', 1240.5, 88, 299.00, 5000, 'available'),
-- ('Swahili Text Corpus', 'Curated conversational Swahili text for NLP', 'sw', 'text', 45.2, 92, 149.00, 20000, 'available'),
-- ('Nigerian Street Scene Images', 'Labeled urban environment photos from Lagos', 'en', 'image', 3200.0, 75, 449.00, 8500, 'available');
