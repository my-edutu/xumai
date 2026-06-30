-- ============================================================================
-- XUM AI — Feature 2 Migration
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- 1. submission_validations — stores per-validator votes
CREATE TABLE IF NOT EXISTS submission_validations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID REFERENCES submissions(id) ON DELETE CASCADE,
  validator_id   UUID REFERENCES users(id)       ON DELETE CASCADE,
  vote           TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  confidence     INTEGER DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  reason         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, validator_id)
);

-- 2. Add quality-pipeline columns to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS validator_count  INTEGER     DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS consensus_score  DECIMAL(5,2);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS pre_check_passed BOOLEAN     DEFAULT TRUE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS pre_check_flags  JSONB       DEFAULT '[]';

-- 3. duplicate_hashes — content fingerprints for deduplication
CREATE TABLE IF NOT EXISTS duplicate_hashes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash       TEXT NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  task_type  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hash, user_id)
);

-- 4. datasets — named AI training datasets
CREATE TABLE IF NOT EXISTS datasets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  task_type   TEXT,
  item_count  INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'building',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. dataset_items — links approved submissions to datasets
CREATE TABLE IF NOT EXISTS dataset_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id    UUID REFERENCES datasets(id)    ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id),
  quality_score DECIMAL(5,2),
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Optional: RLS policies (adjust to match your project's existing policies)
-- ============================================================================

-- submission_validations: users can insert their own votes, read all
ALTER TABLE submission_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own votes"
  ON submission_validations FOR INSERT
  WITH CHECK (validator_id = auth.uid());

CREATE POLICY "Users can read all validations"
  ON submission_validations FOR SELECT
  USING (true);

-- duplicate_hashes: users can read/insert their own hashes
ALTER TABLE duplicate_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own hashes"
  ON duplicate_hashes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- datasets / dataset_items: readable by all authenticated users (admin writes)
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read datasets"
  ON datasets FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER TABLE dataset_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dataset items"
  ON dataset_items FOR SELECT
  USING (auth.role() = 'authenticated');
