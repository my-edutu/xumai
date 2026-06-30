-- API Keys & Scopes Migration
-- This migration creates the tables and RLS policies necessary for the API Keys

-- 1) Create API Keys Table
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Admins can read all keys. (Assuming an 'admin' role or a specific user criteria exists.
-- Using a generic true policy for demonstration, but IN PRODUCTION restrict this!)
CREATE POLICY "Enable read access for internal services and admins" ON public.api_keys FOR SELECT USING (true);

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

CREATE POLICY "Enable read access for scopes" ON public.api_key_scopes FOR SELECT USING (true);

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

-- Typically, logs are insert-only for the application, and read-only for admins
CREATE POLICY "Enable insert access for all" ON public.api_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select access for admins" ON public.api_logs FOR SELECT USING (true);


-- Create index for faster lookups on key_id to check validity
CREATE INDEX idx_api_keys_key_id ON public.api_keys (key_id);
CREATE INDEX idx_api_key_scopes_key_id ON public.api_key_scopes (key_id);
CREATE INDEX idx_api_logs_key_id ON public.api_logs (key_id);
