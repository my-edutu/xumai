-- ============================================================================
-- XUM AI — Feature 3 Migration
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- 1. Recreate user_leaderboard view (adds country column from users.location)
DROP VIEW IF EXISTS user_leaderboard;
CREATE VIEW user_leaderboard AS
SELECT
  u.id         AS user_id,
  u.full_name,
  u.avatar_url,
  u.location   AS country,
  COALESCE(SUM(CASE WHEN t.type IN ('earn', 'bonus') THEN t.amount ELSE 0 END), 0) AS total_earned,
  COUNT(DISTINCT s.id) AS tasks_completed,
  RANK() OVER (
    ORDER BY COALESCE(SUM(CASE WHEN t.type IN ('earn', 'bonus') THEN t.amount ELSE 0 END), 0) DESC
  ) AS rank
FROM users u
LEFT JOIN transactions t ON t.user_id = u.id
LEFT JOIN submissions s  ON s.user_id = u.id AND s.status = 'approved'
GROUP BY u.id, u.full_name, u.avatar_url, u.location;

-- 2. Weekly leaderboard view (earnings & tasks from the current calendar week)
CREATE OR REPLACE VIEW user_weekly_leaderboard AS
SELECT
  u.id         AS user_id,
  u.full_name,
  u.avatar_url,
  u.location   AS country,
  COALESCE(SUM(CASE WHEN t.type IN ('earn', 'bonus') THEN t.amount ELSE 0 END), 0) AS total_earned,
  COUNT(DISTINCT s.id) AS tasks_completed,
  RANK() OVER (
    ORDER BY COALESCE(SUM(CASE WHEN t.type IN ('earn', 'bonus') THEN t.amount ELSE 0 END), 0) DESC
  ) AS rank
FROM users u
LEFT JOIN transactions t ON t.user_id = u.id
     AND t.created_at >= DATE_TRUNC('week', NOW())
LEFT JOIN submissions s  ON s.user_id = u.id
     AND s.status = 'approved'
     AND s.created_at >= DATE_TRUNC('week', NOW())
GROUP BY u.id, u.full_name, u.avatar_url, u.location;

-- 3. RPC: get a single user's global rank
CREATE OR REPLACE FUNCTION get_user_global_rank(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT CAST(rank AS INTEGER)
  FROM user_leaderboard
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- ============================================================================
-- RLHF Tables
-- ============================================================================

-- 4. rlhf_tasks — admin-managed bank of correction prompts
CREATE TABLE IF NOT EXISTS rlhf_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type   TEXT NOT NULL DEFAULT 'correction',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  prompt      TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  category    TEXT,
  reward      DECIMAL(10,2) DEFAULT 2.50,
  difficulty  TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. rlhf_submissions — user corrections keyed to rlhf_tasks
CREATE TABLE IF NOT EXISTS rlhf_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id            UUID REFERENCES rlhf_tasks(id),
  original_response  TEXT,
  corrected_response TEXT NOT NULL,
  correction_reason  TEXT,
  cultural_region    TEXT,
  reward             DECIMAL(10,2),
  submitted_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Seed data: 10 real cultural RLHF correction tasks
-- ============================================================================
INSERT INTO rlhf_tasks (task_type, status, prompt, ai_response, category, reward, difficulty)
VALUES
  (
    'correction', 'active',
    'What is the proper way to greet an elder in Yoruba culture?',
    'In Yoruba culture, you should nod your head and say hello respectfully.',
    'Cultural Norms', 2.50, 'Medium'
  ),
  (
    'correction', 'active',
    'Describe the significance of the Ubuntu philosophy in daily African life.',
    'Ubuntu is a philosophical concept that means being kind to other people.',
    'Philosophy & Values', 4.00, 'Hard'
  ),
  (
    'correction', 'active',
    'What is the cultural meaning of the kola nut in West African ceremonies?',
    'Kola nuts are bitter nuts that are sometimes offered as a gift at celebrations.',
    'Traditions & Rituals', 3.00, 'Medium'
  ),
  (
    'correction', 'active',
    'How do people in Hausa communities traditionally resolve disputes among neighbours?',
    'Disputes in communities are usually settled by local leaders or taken to court.',
    'Social Systems', 3.50, 'Hard'
  ),
  (
    'correction', 'active',
    'What does the word "Baba" mean across different African language groups?',
    'Baba is a word used in some African languages to mean father.',
    'Language & Meaning', 2.00, 'Easy'
  ),
  (
    'correction', 'active',
    'Describe a traditional naming ceremony (Ikomo) in Yoruba/Igbo culture.',
    'A naming ceremony is when parents officially give their newborn baby a name.',
    'Cultural Traditions', 3.00, 'Medium'
  ),
  (
    'correction', 'active',
    'What is the role of the Griot (Jeli) in West African society and oral tradition?',
    'A Griot is a traditional storyteller who tells folk tales to children in the village.',
    'Cultural Roles', 3.50, 'Hard'
  ),
  (
    'correction', 'active',
    'Explain the cultural significance of the "Jollof Wars" between West African nations.',
    'The Jollof Wars refer to arguments about which country makes the best rice dish.',
    'Cultural Identity', 2.50, 'Easy'
  ),
  (
    'correction', 'active',
    'How is respect shown to elders in Swahili-speaking (East African) communities?',
    'Showing respect to elders is an important value in many cultures around the world.',
    'Social Norms', 2.00, 'Easy'
  ),
  (
    'correction', 'active',
    'What is the spiritual and communal significance of the Baobab tree in African traditions?',
    'The Baobab is a large, long-living tree found in Africa that is important to local wildlife.',
    'Spirituality & Nature', 4.00, 'Hard'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Row Level Security for new tables
-- ============================================================================

-- rlhf_tasks: readable by all authenticated users (admin inserts manually)
ALTER TABLE rlhf_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read rlhf_tasks"
  ON rlhf_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

-- rlhf_submissions: users can insert and read their own
ALTER TABLE rlhf_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own rlhf submissions"
  ON rlhf_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read own rlhf submissions"
  ON rlhf_submissions FOR SELECT
  USING (user_id = auth.uid());
