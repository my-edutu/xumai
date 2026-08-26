-- API Keys & Scopes Migration
-- This migration creates the tables and RLS policies necessary for the API Keys

-- 1) Create API Keys Table
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    key_id TEXT UNIQUE NOT NULL, -- e.g. xum_live_9f82...
    secret_hash TEXT NOT NULL, -- hashed secret for authentication
    name TEXT NOT NULL, -- Client name or identifier
    environment TEXT NOT NULL CHECK (environment IN ('test', 'live')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    rate_limit INTEGER NOT NULL DEFAULT 60, -- requests per minute
    ip_allowlist TEXT[], -- Optional array of allowed IPs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for API Keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can read their own API keys" ON public.api_keys
    FOR SELECT USING (
        company_id = auth.uid()::text
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );
CREATE POLICY "Companies can create their own API keys" ON public.api_keys
    FOR INSERT WITH CHECK (company_id = auth.uid()::text);
CREATE POLICY "Companies can revoke their own API keys" ON public.api_keys
    FOR UPDATE USING (company_id = auth.uid()::text)
    WITH CHECK (company_id = auth.uid()::text);

-- 2) Create API Key Scopes Table
-- Scopes define what an API key is authorized to do (e.g., tasks:create, submissions:read)
CREATE TABLE public.api_key_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT NOT NULL REFERENCES public.api_keys(key_id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(key_id, scope)
);

-- Enable RLS for API Key Scopes
ALTER TABLE public.api_key_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their API key scopes" ON public.api_key_scopes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.api_keys k
            WHERE k.key_id = api_key_scopes.key_id
              AND (k.company_id = auth.uid()::text OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
        )
    );
CREATE POLICY "Owners can create their API key scopes" ON public.api_key_scopes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.api_keys k WHERE k.key_id = api_key_scopes.key_id AND k.company_id = auth.uid()::text)
    );

-- 3) Create API Logs Table
-- For auditing: tracks every API request made using a key
CREATE TABLE public.api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT REFERENCES public.api_keys(key_id) ON DELETE SET NULL, -- Null if key was later deleted
    endpoint TEXT NOT NULL,
    request_id TEXT,
    status INTEGER NOT NULL, -- HTTP status code
    ip_address TEXT,
    rate_limited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for API Logs
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Logs are written by service-role Edge Functions and visible only to admins.
CREATE POLICY "Admins can read API logs" ON public.api_logs FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- Create index for faster lookups on key_id to check validity
CREATE INDEX idx_api_keys_key_id ON public.api_keys (key_id);
CREATE INDEX idx_api_key_scopes_key_id ON public.api_key_scopes (key_id);
CREATE INDEX idx_api_logs_key_id ON public.api_logs (key_id);
