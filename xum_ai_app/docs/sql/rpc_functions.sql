-- =============================================================================
-- XUM AI — Missing RPC Functions
-- These are called by the frontend services but were never defined in SQL.
-- Run in Supabase SQL Editor AFTER running migrations.sql and feature3_migration.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. get_user_balance — walletService.getUserBalance()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id TEXT)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(balance, 0) FROM users WHERE id = p_user_id LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 2. get_transaction_history — walletService.getTransactionHistory()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_transaction_history(
    p_user_id TEXT,
    p_limit   INTEGER DEFAULT 20,
    p_offset  INTEGER DEFAULT 0
)
RETURNS TABLE (
    id             UUID,
    user_id        TEXT,
    type           TEXT,
    amount         DECIMAL,
    description    TEXT,
    reference_type TEXT,
    reference_id   TEXT,
    created_at     TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
      id,
      user_id,
      type,
      amount,
      description,
      reference_type,
      reference_id,
      created_at
  FROM transactions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ---------------------------------------------------------------------------
-- 3. get_daily_missions — marketplaceService.getDailyMissions()
-- Returns tasks from featured_tasks or tasks table with unlock logic
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_daily_missions(p_user_id TEXT)
RETURNS TABLE (
    id                      UUID,
    title                   TEXT,
    subtitle                TEXT,
    icon_name               TEXT,
    icon_color              TEXT,
    target_screen           TEXT,
    reward                  DECIMAL,
    estimated_time          TEXT,
    is_locked_for_new_users BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_completed_count INTEGER;
BEGIN
    -- Get user's completed task count
    SELECT COALESCE(COUNT(*), 0)
    INTO v_completed_count
    FROM submissions
    WHERE user_id = p_user_id AND status = 'approved';

    RETURN QUERY
    SELECT
        ft.id,
        ft.title,
        ft.subtitle,
        ft.icon_name,
        ft.icon_color,
        ft.target_screen,
        ft.reward,
        ft.estimated_time,
        CASE WHEN ft.min_completed_tasks > v_completed_count THEN TRUE ELSE FALSE END AS is_locked_for_new_users
    FROM featured_tasks ft
    WHERE ft.is_active = TRUE
    ORDER BY ft.display_order ASC, ft.created_at DESC
    LIMIT 20;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. get_xum_judge_tasks — marketplaceService.getXumJudgeTasks()
-- Returns judge tasks with per-user unlock status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_xum_judge_tasks(p_user_id TEXT)
RETURNS TABLE (
    id             UUID,
    title          TEXT,
    subtitle       TEXT,
    icon_name      TEXT,
    icon_color     TEXT,
    target_screen  TEXT,
    reward         DECIMAL,
    estimated_time TEXT,
    is_unlocked    BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_completed_count INTEGER;
BEGIN
    SELECT COALESCE(COUNT(*), 0)
    INTO v_completed_count
    FROM submissions
    WHERE user_id = p_user_id AND status = 'approved';

    RETURN QUERY
    SELECT
        jt.id,
        jt.title,
        jt.subtitle,
        jt.icon_name,
        jt.icon_color,
        jt.target_screen,
        jt.reward,
        jt.estimated_time,
        CASE WHEN jt.required_completed_tasks <= v_completed_count THEN TRUE ELSE FALSE END AS is_unlocked
    FROM xum_judge_tasks jt
    WHERE jt.is_active = TRUE
    ORDER BY jt.display_order ASC;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. check_judge_unlock — marketplaceService.checkJudgeUnlock()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_judge_unlock(p_user_id TEXT)
RETURNS TABLE (
    is_unlocked      BOOLEAN,
    completed_tasks  INTEGER,
    required_tasks   INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_count    INTEGER;
    v_required INTEGER := 10;  -- require 10 approved submissions to unlock Judge
BEGIN
    SELECT COALESCE(COUNT(*), 0)
    INTO v_count
    FROM submissions
    WHERE user_id = p_user_id AND status = 'approved';

    RETURN QUERY SELECT
        v_count >= v_required,
        v_count,
        v_required;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. get_user_earnings_period — walletService.getUserEarningsPeriod()
-- Used by HomeScreen for today/month earnings stats
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_earnings_period(p_user_id TEXT)
RETURNS TABLE (today DECIMAL, month DECIMAL)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN DATE(t.created_at) = CURRENT_DATE AND t.amount > 0 THEN t.amount ELSE 0 END), 0) AS today,
    COALESCE(SUM(CASE WHEN DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', NOW()) AND t.amount > 0 THEN t.amount ELSE 0 END), 0) AS month
  FROM transactions t
  WHERE t.user_id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Supporting tables (if not yet created)
-- ---------------------------------------------------------------------------

-- featured_tasks: DB-driven task cards on Home and Marketplace screens
CREATE TABLE IF NOT EXISTS featured_tasks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                   TEXT NOT NULL,
    subtitle                TEXT,
    icon_name               TEXT DEFAULT 'assignment',
    icon_color              TEXT DEFAULT '#1349ec',
    gradient_start          TEXT DEFAULT '#1349ec',
    gradient_end            TEXT DEFAULT '#4338ca',
    target_screen           TEXT NOT NULL,
    reward                  DECIMAL(10, 2) DEFAULT 0,
    estimated_time          TEXT DEFAULT '2-5 min',
    min_completed_tasks     INTEGER DEFAULT 0,    -- 0 = open to all
    display_order           INTEGER DEFAULT 0,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- xum_judge_tasks: DB-driven XUM Judge task list
CREATE TABLE IF NOT EXISTS xum_judge_tasks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                   TEXT NOT NULL,
    subtitle                TEXT,
    icon_name               TEXT DEFAULT 'gavel',
    icon_color              TEXT DEFAULT '#8b5cf6',
    target_screen           TEXT NOT NULL,
    reward                  DECIMAL(10, 2) DEFAULT 2.50,
    estimated_time          TEXT DEFAULT '3-5 min',
    required_completed_tasks INTEGER DEFAULT 10,
    display_order           INTEGER DEFAULT 0,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Seed featured_tasks
INSERT INTO featured_tasks (title, subtitle, icon_name, icon_color, gradient_start, gradient_end, target_screen, reward, estimated_time, min_completed_tasks, display_order) VALUES
    ('Voice Recording', 'Record in your native language', 'mic', '#ec4899', '#ec4899', '#f43f5e', 'VOICE_TASK', 1.50, '2 min', 0, 1),
    ('Image Capture', 'Photograph labeled objects', 'camera-alt', '#8b5cf6', '#8b5cf6', '#6366f1', 'IMAGE_TASK', 0.80, '1 min', 0, 2),
    ('Video Collection', 'Record short gesture clips', 'videocam', '#10b981', '#10b981', '#059669', 'VIDEO_TASK', 5.00, '5 min', 0, 3),
    ('XUM Lexicon', 'Name the world in your language', 'translate', '#f59e0b', '#f59e0b', '#d97706', 'LEXICON_TASK', 1.20, '3 min', 0, 4),
    ('Translation Review', 'Verify translations', 'verified', '#3b82f6', '#3b82f6', '#1d4ed8', 'VALIDATION_TASK_EXECUTION', 2.00, '3 min', 5, 5)
ON CONFLICT DO NOTHING;

-- Seed xum_judge_tasks
INSERT INTO xum_judge_tasks (title, subtitle, icon_name, icon_color, target_screen, reward, estimated_time, required_completed_tasks, display_order) VALUES
    ('AI Response Correction', 'Rewrite AI answers with cultural context', 'edit-note', '#8b5cf6', 'RLHF_CORRECTION', 2.50, '3-5 min', 10, 1),
    ('Safety Scoring', 'Evaluate AI outputs for safety risks', 'security', '#ef4444', 'SAFETY_SCORING', 0.50, '2-3 min', 10, 2),
    ('Cultural Review', 'Assess cultural appropriateness', 'language', '#7c3aed', 'CULTURAL_APPROPRIATENESS', 0.75, '3-5 min', 15, 3)
ON CONFLICT DO NOTHING;

-- RLS for new tables
ALTER TABLE featured_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone authenticated can read featured_tasks"
    ON featured_tasks FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE xum_judge_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone authenticated can read xum_judge_tasks"
    ON xum_judge_tasks FOR SELECT USING (auth.role() = 'authenticated');
