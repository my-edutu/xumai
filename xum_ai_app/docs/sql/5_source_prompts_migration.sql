-- ============================================================
-- XUM AI — 5-Source Data Model Migrations
-- Run these in Supabase SQL Editor
-- ============================================================

-- 1. Create a prompt_source type
CREATE TYPE prompt_source AS ENUM ('enterprise', 'gap_engine', 'user_capture', 'third_party', 'ai_generated');

-- 2. Update existing prompt tables
ALTER TABLE capture_prompts 
  ADD COLUMN IF NOT EXISTS source prompt_source DEFAULT 'gap_engine',
  ADD COLUMN IF NOT EXISTS enterprise_client_id TEXT, -- Reference if enterprise
  ADD COLUMN IF NOT EXISTS origin_reference TEXT;     -- E.g., gap insight ID or 3rd party dataset name

ALTER TABLE rlhf_tasks 
  ADD COLUMN IF NOT EXISTS source prompt_source DEFAULT 'gap_engine',
  ADD COLUMN IF NOT EXISTS enterprise_client_id TEXT,
  ADD COLUMN IF NOT EXISTS origin_reference TEXT;

ALTER TABLE lexicon_concepts 
  ADD COLUMN IF NOT EXISTS source prompt_source DEFAULT 'gap_engine',
  ADD COLUMN IF NOT EXISTS enterprise_client_id TEXT,
  ADD COLUMN IF NOT EXISTS origin_reference TEXT;

-- 3. New Table: Enterprise Requests
-- To track bulk requests from AI labs
CREATE TABLE IF NOT EXISTS enterprise_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  request_description TEXT NOT NULL,
  target_modality TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  fulfilled_count INTEGER DEFAULT 0,
  budget_allocated DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. New Table: Third-Party Datasets
-- To track ingested open datasets waiting context/labeling
CREATE TABLE IF NOT EXISTS third_party_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_name TEXT NOT NULL,
  source_url TEXT,
  license_type TEXT,
  item_count INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ingested', -- 'ingested', 'processing', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
