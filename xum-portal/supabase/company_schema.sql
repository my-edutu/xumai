-- Company Specific Schema Extensions
-- Version: 1.0

-- 1. Company Profiles
CREATE TABLE IF NOT EXISTS public.company_profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    sector VARCHAR(100),
    contact_email VARCHAR(255),
    api_key_last_prefix VARCHAR(10),
    billing_address JSONB,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    industry_tag VARCHAR(50),
    budget_limit DECIMAL(12,2),
    budget_spent DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'draft',
    
    default_min_trust_score DECIMAL(3,1) DEFAULT 5.0,
    default_min_level INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived'))
);

-- 3. Link Tasks to Projects
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 4. Company API Keys
CREATE TABLE IF NOT EXISTS public.company_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Company Deposits/Billing
CREATE TABLE IF NOT EXISTS public.company_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    project_id UUID REFERENCES public.projects(id),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT valid_type CHECK (type IN ('deposit', 'spending', 'refund'))
);

-- RLS Policies
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage own projects" ON public.projects FOR ALL USING (auth.uid() = company_id);
CREATE POLICY "Companies can view own profile" ON public.company_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Companies can view own transactions" ON public.company_transactions FOR SELECT USING (auth.uid() = company_id);
