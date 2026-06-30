-- ============================================================================
-- XUM AI — Lexicon Quality scoring and Datasets
-- ============================================================================

-- 1. Add quality scoring columns to lexicon_submissions
ALTER TABLE lexicon_submissions 
  ADD COLUMN IF NOT EXISTS audio_snr DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS audio_clarity DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5,2);

-- 2. Ensure datasets and dataset_items exist (from feature 2 or new)
CREATE TABLE IF NOT EXISTS datasets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  task_type   TEXT,
  item_count  INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'active', -- 'active' | 'archived'
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id    UUID REFERENCES datasets(id)    ON DELETE CASCADE,
  submission_id UUID, -- Flexible link
  quality_score DECIMAL(5,2),
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SQL function to generate a lexicon dataset from approved submissions
CREATE OR REPLACE FUNCTION generate_lexicon_dataset(p_name TEXT, p_category TEXT DEFAULT NULL)
RETURNS SETOF datasets AS $$
DECLARE
  v_dataset_id UUID;
  v_item_count INTEGER;
BEGIN
  -- Create the dataset record
  INSERT INTO datasets (name, description, task_type, status)
  VALUES (p_name, 'Generated from approved lexicon submissions' || COALESCE(' for category: ' || p_category, ''), 'lexicon', 'active')
  RETURNING id INTO v_dataset_id;

  -- Add items from approved lexicon submissions
  INSERT INTO dataset_items (dataset_id, submission_id, quality_score, tags)
  SELECT 
    v_dataset_id, 
    id, 
    quality_score, 
    ARRAY[language, category]
  FROM lexicon_submissions
  WHERE status = 'approved'
  AND (p_category IS NULL OR category = p_category);

  -- Update item count
  SELECT COUNT(*) INTO v_item_count FROM dataset_items WHERE dataset_id = v_dataset_id;
  UPDATE datasets SET item_count = v_item_count WHERE id = v_dataset_id;

  RETURN QUERY SELECT * FROM datasets WHERE id = v_dataset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
