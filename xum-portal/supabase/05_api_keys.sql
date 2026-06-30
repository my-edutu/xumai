-- API Key Management for Company Portal
-- Version: 1.0
-- Secure API access for programmatic data retrieval

-- Update existing company_api_keys table with additional fields
ALTER TABLE public.company_api_keys 
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY['read:projects', 'read:exports'],
ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 100, -- Requests per minute
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS request_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_request_at TIMESTAMP WITH TIME ZONE;

-- 1. API Request Logs (For rate limiting and analytics)
CREATE TABLE IF NOT EXISTS public.api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.company_api_keys(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Request Details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    
    -- Client Info
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Function: Validate API Key
CREATE OR REPLACE FUNCTION validate_api_key(
    p_key_prefix VARCHAR,
    p_key_hash TEXT
)
RETURNS TABLE (
    company_id UUID,
    permissions TEXT[],
    is_valid BOOLEAN,
    rate_limit INTEGER
)
AS $$
DECLARE
    v_key RECORD;
BEGIN
    SELECT 
        ak.company_id,
        ak.permissions,
        ak.rate_limit,
        ak.is_active,
        ak.expires_at,
        ak.id as key_id
    INTO v_key
    FROM company_api_keys ak
    WHERE ak.key_hash = p_key_hash
      AND ak.is_active = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT[], FALSE, 0;
        RETURN;
    END IF;
    
    -- Check expiration
    IF v_key.expires_at IS NOT NULL AND v_key.expires_at < now() THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT[], FALSE, 0;
        RETURN;
    END IF;
    
    -- Update last used
    UPDATE company_api_keys
    SET 
        last_used_at = now(),
        request_count = request_count + 1
    WHERE id = v_key.key_id;
    
    RETURN QUERY SELECT v_key.company_id, v_key.permissions, TRUE, v_key.rate_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function: Check Rate Limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_api_key_id UUID
)
RETURNS BOOLEAN
AS $$
DECLARE
    v_limit INTEGER;
    v_request_count INTEGER;
BEGIN
    -- Get key's rate limit
    SELECT rate_limit INTO v_limit
    FROM company_api_keys
    WHERE id = p_api_key_id;
    
    -- Count requests in last minute
    SELECT COUNT(*) INTO v_request_count
    FROM api_request_logs
    WHERE api_key_id = p_api_key_id
      AND created_at > now() - INTERVAL '1 minute';
    
    RETURN v_request_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Generate API Key (returns unhashed key once)
CREATE OR REPLACE FUNCTION generate_api_key(
    p_company_id UUID,
    p_name VARCHAR,
    p_permissions TEXT[] DEFAULT ARRAY['read:projects', 'read:exports']
)
RETURNS TABLE (
    key_id UUID,
    api_key TEXT,
    prefix VARCHAR
)
AS $$
DECLARE
    v_key_id UUID;
    v_raw_key TEXT;
    v_prefix VARCHAR;
    v_hash TEXT;
BEGIN
    -- Generate random key: xum_sk_<random>
    v_prefix := 'xum_sk_';
    v_raw_key := v_prefix || encode(gen_random_bytes(24), 'base64');
    v_raw_key := replace(replace(v_raw_key, '+', ''), '/', ''); -- URL-safe
    
    -- Hash for storage
    v_hash := encode(sha256(v_raw_key::bytea), 'hex');
    
    -- Store key
    INSERT INTO company_api_keys (company_id, key_hash, name, permissions)
    VALUES (p_company_id, v_hash, p_name, p_permissions)
    RETURNING id INTO v_key_id;
    
    -- Update last prefix for display
    UPDATE company_api_keys
    SET api_key_last_prefix = LEFT(v_raw_key, 12) || '...'
    WHERE id = v_key_id;
    
    -- Return the raw key (only shown once)
    RETURN QUERY SELECT v_key_id, v_raw_key, v_prefix;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own API logs" ON public.api_request_logs FOR SELECT USING (auth.uid() = company_id);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_time ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON company_api_keys(key_hash);

-- 7. Cleanup: Auto-delete old logs (keep 30 days)
-- Run via pg_cron or scheduled Edge Function
CREATE OR REPLACE FUNCTION cleanup_api_logs()
RETURNS INTEGER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM api_request_logs
    WHERE created_at < now() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
