-- ============================================================
-- XUM AI — Database Migrations
-- Run these in Supabase SQL Editor
-- ============================================================

-- 1. Add streak tracking to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_submission_date DATE,
  ADD COLUMN IF NOT EXISTS accuracy_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 100;

-- 2. Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reward_amount DECIMAL(10,2) DEFAULT 2.00,
  paid_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- 3. Lexicon submissions
CREATE TABLE IF NOT EXISTS lexicon_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  concept_id TEXT,
  concept TEXT NOT NULL,
  local_word TEXT NOT NULL,
  cultural_note TEXT,
  pronunciation_url TEXT,
  input_mode TEXT DEFAULT 'text',   -- 'text' | 'voice' | 'both'
  language TEXT,
  reward DECIMAL(10,2) DEFAULT 1.00,
  status TEXT DEFAULT 'pending',    -- 'pending' | 'approved' | 'rejected'
  validator_votes INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lexicon_user ON lexicon_submissions(user_id);

-- 4. RLHF correction submissions
CREATE TABLE IF NOT EXISTS rlhf_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT,
  original_response TEXT,
  corrected_response TEXT NOT NULL,
  correction_reason TEXT,
  cultural_region TEXT,
  reward DECIMAL(10,2) DEFAULT 2.50,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rlhf_user ON rlhf_submissions(user_id);

-- 5. Audit logs (admin action trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  payload JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- 6. API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] DEFAULT '{}',
  rate_limit INTEGER DEFAULT 1000,
  usage_today INTEGER DEFAULT 0,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_id);

-- 7. Admin sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  admin_name TEXT,
  admin_email TEXT,
  role TEXT DEFAULT 'qa_reviewer',
  device TEXT,
  ip_address TEXT,
  country TEXT,
  login_time TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',     -- 'active' | 'idle' | 'expired'
  requires_reauth BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON admin_sessions(status);

-- 8. Fraud flags table
CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,          -- 'bot_speed' | 'device_farm' | 'duplicate_account' | 'location_anomaly' | 'duplicate_hash'
  submission_count INTEGER DEFAULT 0,
  flag_score DECIMAL(4,2) DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_score ON fraud_flags(flag_score DESC);

-- 9. Duplicate hashes table
CREATE TABLE IF NOT EXISTS duplicate_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT NOT NULL UNIQUE,
  task_type TEXT,
  count INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'flagged'     -- 'flagged' | 'resolved'
);

-- 10. RLHF tasks table (for RLHFCorrectionScreen)
CREATE TABLE IF NOT EXISTS rlhf_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT DEFAULT 'correction',
  prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  category TEXT,
  reward DECIMAL(10,2) DEFAULT 2.50,
  difficulty TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Lexicon concepts table (for LexiconTaskScreen)
CREATE TABLE IF NOT EXISTS lexicon_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji TEXT,
  word TEXT NOT NULL,
  category TEXT,
  reward DECIMAL(10,2) DEFAULT 1.00,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some initial lexicon concepts
INSERT INTO lexicon_concepts (emoji, word, category, reward, status) VALUES
  ('🐕', 'Dog',    'Animals',  1.20, 'active'),
  ('🏪', 'Market', 'Places',   1.00, 'active'),
  ('☕', 'Cup',    'Objects',  0.80, 'active'),
  ('🌳', 'Tree',   'Nature',   0.90, 'active'),
  ('👨‍👩‍👦', 'Family', 'People',   1.50, 'active'),
  ('🍲', 'Food',   'Food',     1.10, 'active'),
  ('💧', 'Water',  'Nature',   0.80, 'active'),
  ('🏠', 'Home',   'Places',   1.00, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Streak update function — call after each approved submission
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_submission_date INTO v_last_date FROM users WHERE id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
    -- streak broken or first time
    UPDATE users SET streak_count = 1, last_submission_date = v_today WHERE id = p_user_id;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- consecutive day
    UPDATE users SET streak_count = streak_count + 1, last_submission_date = v_today WHERE id = p_user_id;
  ELSIF v_last_date = v_today THEN
    -- already submitted today, just update date
    UPDATE users SET last_submission_date = v_today WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
