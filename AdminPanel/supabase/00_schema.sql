-- Core Schema for XUM AI
-- Version: 1.0

-- 1. Users Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'contributor', -- 'contributor', 'company', 'admin'
  
  -- Gamification
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  target_xp INTEGER DEFAULT 100,
  trust_score DECIMAL(3,1) DEFAULT 5.0, -- 0.0 to 10.0
  
  -- Financial
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
  
  -- Profile
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  preferred_language VARCHAR(10) DEFAULT 'en',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('contributor', 'company', 'admin')),
  CONSTRAINT valid_trust_score CHECK (trust_score >= 0 AND trust_score <= 10)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON public.users(trust_score);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Task Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  task_type VARCHAR(50) NOT NULL, -- 'audio', 'image', 'text', 'validation', 'linguasense', 'rlhf'
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  
  -- Rewards
  reward DECIMAL(10,2) NOT NULL,
  xp_reward INTEGER DEFAULT 10,
  
  -- Logistics
  time_estimate VARCHAR(50), 
  max_submissions INTEGER DEFAULT 1000,
  current_submissions INTEGER DEFAULT 0,
  
  -- Requirements
  min_trust_score DECIMAL(3,1) DEFAULT 5.0,
  min_level INTEGER DEFAULT 1,
  required_languages TEXT[], 
  
  -- Priority & Status
  is_priority BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'archived'
  
  -- Metadata
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_task_type CHECK (task_type IN ('audio', 'image', 'text', 'validation', 'linguasense', 'rlhf')),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  CONSTRAINT positive_reward CHECK (reward > 0)
);

CREATE INDEX IF NOT EXISTS idx_tasks_type ON public.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(is_priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

-- 3. Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Submission Data
  submission_data JSONB NOT NULL,
  
  -- Review Process
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'revision_requested'
  review_status VARCHAR(20), -- 'auto_approved', 'human_reviewed', 'consensus_validated'
  quality_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Admin Review
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Flags
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  
  -- Metadata
  time_spent_seconds INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  CONSTRAINT valid_quality_score CHECK (quality_score >= 0 AND quality_score <= 1)
);

CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON public.submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- 4. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL, -- 'paypal', 'bank_transfer', 'crypto_usdc'
  account_details JSONB NOT NULL, 
  
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected', 'cancelled'
  processed_by UUID REFERENCES public.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  external_transaction_id VARCHAR(255),
  rejection_reason TEXT,
  
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_method CHECK (method IN ('paypal', 'bank_transfer', 'crypto_usdc')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  CONSTRAINT min_withdrawal CHECK (amount >= 5.00)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL, -- 'earning', 'withdrawal', 'bonus', 'penalty', 'refund'
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  
  submission_id UUID REFERENCES public.submissions(id),
  withdrawal_id UUID REFERENCES public.withdrawals(id),
  
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT valid_type CHECK (type IN ('earning', 'withdrawal', 'bonus', 'penalty', 'refund'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- 6. Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), 
  criteria_type VARCHAR(50), 
  criteria_threshold INTEGER,
  xp_bonus INTEGER DEFAULT 0,
  badge_color VARCHAR(20), 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50), 
  action_url VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('task_completion', 'withdrawal_processed', 'achievement_unlocked', 'admin_message', 'system_update'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 8. Activity Logs
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(100), 
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.user_activity_logs(user_id);
