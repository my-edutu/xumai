-- Dataset Marketplace System
-- Version: 1.0
-- Allows companies to publish and sell curated datasets

-- 1. Published Datasets (Items for sale in marketplace)
CREATE TABLE IF NOT EXISTS public.marketplace_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    seller_company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Listing Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    preview_samples JSONB, -- First 5 records for preview
    thumbnail_url TEXT,
    
    -- Dataset Specs
    record_count INTEGER,
    data_types TEXT[], -- e.g., ['text', 'audio', 'image']
    languages TEXT[],
    industry_tags TEXT[],
    
    -- Pricing
    price DECIMAL(12,2) NOT NULL,
    pricing_model VARCHAR(20) DEFAULT 'one_time', -- 'one_time', 'subscription', 'per_record'
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Quality Metrics
    avg_quality_score DECIMAL(3,2),
    validation_method VARCHAR(50), -- 'consensus', 'expert', 'automated'
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending_review', 'published', 'archived'
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT valid_pricing CHECK (pricing_model IN ('one_time', 'subscription', 'per_record')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'pending_review', 'published', 'archived'))
);

-- 2. Dataset Purchases (Access grants)
CREATE TABLE IF NOT EXISTS public.dataset_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.marketplace_datasets(id) ON DELETE CASCADE,
    buyer_company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Transaction
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Access
    access_granted BOOLEAN DEFAULT false,
    access_expires_at TIMESTAMP WITH TIME ZONE, -- For subscriptions
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 10,
    
    -- Metadata
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(dataset_id, buyer_company_id)
);

-- 3. Dataset Reviews
CREATE TABLE IF NOT EXISTS public.dataset_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.marketplace_datasets(id) ON DELETE CASCADE,
    reviewer_company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL, -- 1-5 stars
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    UNIQUE(dataset_id, reviewer_company_id)
);

-- 4. Function: Publish Dataset to Marketplace
CREATE OR REPLACE FUNCTION publish_to_marketplace(
    p_project_id UUID,
    p_title VARCHAR,
    p_description TEXT,
    p_price DECIMAL,
    p_industry_tags TEXT[]
)
RETURNS UUID
AS $$
DECLARE
    v_listing_id UUID;
    v_company_id UUID;
    v_stats RECORD;
BEGIN
    -- Get project owner
    SELECT company_id INTO v_company_id
    FROM projects
    WHERE id = p_project_id;
    
    IF v_company_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    -- Calculate stats from submissions
    SELECT 
        COUNT(*) as record_count,
        AVG(quality_score) as avg_quality,
        ARRAY_AGG(DISTINCT t.task_type) as data_types
    INTO v_stats
    FROM submissions s
    JOIN tasks t ON s.task_id = t.id
    WHERE t.project_id = p_project_id AND s.status = 'approved';
    
    -- Sample first 5 records for preview
    INSERT INTO marketplace_datasets (
        project_id, seller_company_id, title, description, price,
        record_count, avg_quality_score, data_types, industry_tags,
        preview_samples, status
    )
    VALUES (
        p_project_id, v_company_id, p_title, p_description, p_price,
        v_stats.record_count, v_stats.avg_quality, v_stats.data_types, p_industry_tags,
        (
            SELECT jsonb_agg(submission_data) 
            FROM (
                SELECT s.submission_data 
                FROM submissions s
                JOIN tasks t ON s.task_id = t.id
                WHERE t.project_id = p_project_id AND s.status = 'approved'
                LIMIT 5
            ) samples
        ),
        'pending_review'
    )
    RETURNING id INTO v_listing_id;
    
    RETURN v_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: Grant Access After Purchase
CREATE OR REPLACE FUNCTION grant_dataset_access(
    p_purchase_id UUID
)
RETURNS BOOLEAN
AS $$
BEGIN
    UPDATE dataset_purchases
    SET 
        access_granted = true,
        access_expires_at = CASE 
            WHEN (SELECT pricing_model FROM marketplace_datasets WHERE id = dataset_id) = 'subscription'
            THEN now() + INTERVAL '30 days'
            ELSE NULL
        END
    WHERE id = p_purchase_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function: Check Access & Download
CREATE OR REPLACE FUNCTION check_dataset_access(
    p_dataset_id UUID,
    p_company_id UUID
)
RETURNS BOOLEAN
AS $$
DECLARE
    v_access RECORD;
BEGIN
    SELECT access_granted, access_expires_at, download_count, max_downloads
    INTO v_access
    FROM dataset_purchases
    WHERE dataset_id = p_dataset_id AND buyer_company_id = p_company_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    IF NOT v_access.access_granted THEN
        RETURN FALSE;
    END IF;
    
    IF v_access.access_expires_at IS NOT NULL AND v_access.access_expires_at < now() THEN
        RETURN FALSE;
    END IF;
    
    IF v_access.download_count >= v_access.max_downloads THEN
        RETURN FALSE;
    END IF;
    
    -- Increment download count
    UPDATE dataset_purchases
    SET download_count = download_count + 1
    WHERE dataset_id = p_dataset_id AND buyer_company_id = p_company_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies
ALTER TABLE public.marketplace_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view published datasets
CREATE POLICY "Public can view published datasets" ON public.marketplace_datasets 
    FOR SELECT USING (status = 'published');

-- Sellers can manage their own
CREATE POLICY "Sellers can manage own listings" ON public.marketplace_datasets 
    FOR ALL USING (auth.uid() = seller_company_id);

-- Buyers can view their purchases
CREATE POLICY "Buyers can view own purchases" ON public.dataset_purchases 
    FOR SELECT USING (auth.uid() = buyer_company_id);

-- Verified purchasers can review
CREATE POLICY "Purchasers can review" ON public.dataset_reviews 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM dataset_purchases 
            WHERE dataset_id = dataset_reviews.dataset_id 
            AND buyer_company_id = auth.uid()
            AND access_granted = true
        )
    );

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_datasets(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_datasets(seller_company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON dataset_purchases(buyer_company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_dataset ON dataset_reviews(dataset_id);
