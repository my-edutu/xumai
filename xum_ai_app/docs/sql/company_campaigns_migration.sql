-- ============================================================================
-- XUM AI — Company Campaigns Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================

-- 1. company_campaigns table
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_campaigns (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id              text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                   text NOT NULL,
    description             text,
    guidelines              jsonb DEFAULT '{}'::jsonb,
    sample_reference        text,
    task_type               text NOT NULL,
    target_count            int NOT NULL CHECK (target_count > 0),
    completed_count         int DEFAULT 0,
    status                  text DEFAULT 'pending_review'
                                CHECK (status IN ('draft','pending_review','active','paused','completed','cancelled')),
    priority_level          text DEFAULT 'standard'
                                CHECK (priority_level IN ('standard','high','urgent')),
    feed_priority           int DEFAULT 10,
    timeframe_days          int DEFAULT 30,
    starts_at               timestamptz,
    ends_at                 timestamptz,
    quality_tier            text DEFAULT 'standard'
                                CHECK (quality_tier IN ('basic','standard','premium')),
    region_filter           text[] DEFAULT '{}',
    language_filter         text[] DEFAULT '{}',
    min_contributor_level   int DEFAULT 0,
    max_submissions_per_user int DEFAULT 10,
    base_rate_per_item      numeric(10,4),
    quality_multiplier      numeric(6,4),
    timeframe_multiplier    numeric(6,4),
    volume_discount         numeric(6,4),
    subtotal                numeric(12,2),
    platform_fee            numeric(12,2),
    total_cost              numeric(12,2),
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);

-- 2. Indexes for feed queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_campaigns_status_priority
    ON company_campaigns (status, feed_priority DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_company
    ON company_campaigns (company_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_status_created
    ON company_campaigns (status, created_at DESC);

-- 3. Auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON company_campaigns;
CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON company_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_campaigns_updated_at();

-- 4. RPC: company_create_campaign
-- ============================================================================
CREATE OR REPLACE FUNCTION company_create_campaign(
    p_user_id           text,
    p_title             text,
    p_description       text,
    p_task_type         text,
    p_target_count      int,
    p_guidelines        jsonb    DEFAULT '{}'::jsonb,
    p_timeframe_days    int     DEFAULT 30,
    p_quality_tier      text    DEFAULT 'standard',
    p_region_filter     text[]  DEFAULT '{}',
    p_language_filter   text[]  DEFAULT '{}',
    p_min_level         int     DEFAULT 0,
    p_max_per_user      int     DEFAULT 10,
    p_total_cost        numeric DEFAULT 0,
    p_platform_fee      numeric DEFAULT 0,
    p_sample_reference  text    DEFAULT NULL,
    p_status            text    DEFAULT 'pending_review'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign_id uuid;
    v_result      json;
BEGIN
    -- Verify caller owns or is the company
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO company_campaigns (
        company_id, title, description, guidelines,
        sample_reference, task_type, target_count,
        timeframe_days, quality_tier,
        region_filter, language_filter,
        min_contributor_level, max_submissions_per_user,
        platform_fee, total_cost, status,
        ends_at
    ) VALUES (
        p_user_id, p_title, p_description, p_guidelines,
        p_sample_reference, p_task_type, p_target_count,
        p_timeframe_days, p_quality_tier,
        p_region_filter, p_language_filter,
        p_min_level, p_max_per_user,
        p_platform_fee, p_total_cost, p_status,
        CASE WHEN p_status = 'active' THEN now() + (p_timeframe_days || ' days')::interval ELSE NULL END
    )
    RETURNING id INTO v_campaign_id;

    SELECT row_to_json(c) INTO v_result
    FROM company_campaigns c
    WHERE c.id = v_campaign_id;

    RETURN v_result;
END;
$$;

-- 5. RPC: company_get_campaigns
-- Returns all campaigns for a company user, sorted by newest first
-- ============================================================================
CREATE OR REPLACE FUNCTION company_get_campaigns(p_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_agg(c ORDER BY c.created_at DESC) INTO v_result
    FROM company_campaigns c
    WHERE c.company_id = p_user_id;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- 6. RPC: get_active_campaigns_for_feed
-- Used by the contributor feed — returns active campaigns, optional filters
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_campaigns_for_feed(
    p_region        text    DEFAULT NULL,
    p_min_level     int     DEFAULT 0,
    p_limit         int     DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_agg(sub ORDER BY sub.feed_priority DESC, sub.created_at DESC)
    INTO v_result
    FROM (
        SELECT
            c.*,
            u.full_name AS company_name
        FROM company_campaigns c
        LEFT JOIN users u ON u.id = c.company_id
        WHERE c.status = 'active'
          AND c.min_contributor_level <= COALESCE(p_min_level, 0)
          AND (
              p_region IS NULL
              OR 'Global' = ANY(c.region_filter)
              OR p_region = ANY(c.region_filter)
          )
        ORDER BY c.feed_priority DESC, c.created_at DESC
        LIMIT p_limit
    ) sub;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- 7. Row Level Security (RLS)
-- ============================================================================
ALTER TABLE company_campaigns ENABLE ROW LEVEL SECURITY;

-- Companies can see their own campaigns
CREATE POLICY "company_owns_campaigns"
    ON company_campaigns
    FOR ALL
    USING (company_id = auth.uid()::text);

-- Any authenticated user can read active campaigns (for the feed)
CREATE POLICY "contributors_view_active_campaigns"
    ON company_campaigns
    FOR SELECT
    USING (status = 'active');

-- ============================================================================
-- VERIFICATION QUERIES (run to check setup)
-- ============================================================================
-- SELECT count(*) FROM company_campaigns;
-- SELECT company_create_campaign('YOUR_USER_UUID'::uuid, 'Test', 'Desc', 'audio', 100);
-- SELECT get_active_campaigns_for_feed();
