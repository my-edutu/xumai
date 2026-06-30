-- Dataset Export & Versioning System
-- Version: 1.0
-- Handles packaging submissions into downloadable datasets

-- 1. Dataset Exports (Final packaged data)
CREATE TABLE IF NOT EXISTS public.dataset_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Version Control
    version VARCHAR(20) NOT NULL,
    version_notes TEXT,
    
    -- Export Details
    format VARCHAR(20) NOT NULL, -- 'json', 'csv', 'coco', 'parquet'
    file_path TEXT, -- Supabase Storage path
    file_size_bytes BIGINT,
    record_count INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'failed', 'expired'
    signed_url TEXT,
    signed_url_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Filters applied during export
    export_filters JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    CONSTRAINT valid_format CHECK (format IN ('json', 'csv', 'coco', 'parquet')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'expired'))
);

-- 2. Dataset Versions (Track history)
CREATE TABLE IF NOT EXISTS public.dataset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_tag VARCHAR(50), -- e.g., 'v1.0-cleaned', 'v1.1-augmented'
    
    -- Stats at this version
    submission_count INTEGER,
    approval_rate DECIMAL(5,2),
    quality_score_avg DECIMAL(3,2),
    
    -- Changelog
    changes_summary TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.users(id),
    
    UNIQUE(project_id, version_number)
);

-- 3. Export Queue (For async processing)
CREATE TABLE IF NOT EXISTS public.export_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID REFERENCES public.dataset_exports(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT max_ten_attempts CHECK (attempts <= 10)
);

-- 4. Function: Request Dataset Export
CREATE OR REPLACE FUNCTION request_dataset_export(
    p_project_id UUID,
    p_format VARCHAR,
    p_version VARCHAR DEFAULT '1.0',
    p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
AS $$
DECLARE
    v_export_id UUID;
    v_company_id UUID;
BEGIN
    -- Get company ID from project
    SELECT company_id INTO v_company_id
    FROM projects
    WHERE id = p_project_id;
    
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    -- Verify caller owns the project
    IF v_company_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this project';
    END IF;
    
    -- Create export record
    INSERT INTO dataset_exports (project_id, company_id, version, format, export_filters, status)
    VALUES (p_project_id, v_company_id, p_version, p_format, p_filters, 'pending')
    RETURNING id INTO v_export_id;
    
    -- Add to queue
    INSERT INTO export_queue (export_id, priority)
    VALUES (v_export_id, 5);
    
    RETURN v_export_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: Get Project Submissions for Export
CREATE OR REPLACE FUNCTION get_export_data(
    p_project_id UUID,
    p_status VARCHAR DEFAULT 'approved'
)
RETURNS TABLE (
    submission_id UUID,
    task_title VARCHAR,
    task_type VARCHAR,
    submission_data JSONB,
    quality_score DECIMAL,
    submitted_at TIMESTAMP WITH TIME ZONE
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        t.title,
        t.task_type,
        s.submission_data,
        s.quality_score,
        s.submitted_at
    FROM submissions s
    JOIN tasks t ON s.task_id = t.id
    WHERE t.project_id = p_project_id
      AND s.status = p_status
    ORDER BY s.submitted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies
ALTER TABLE public.dataset_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage own exports" ON public.dataset_exports FOR ALL USING (auth.uid() = company_id);
CREATE POLICY "Companies can view own versions" ON public.dataset_versions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM projects WHERE id = project_id AND company_id = auth.uid()));
CREATE POLICY "System manages export queue" ON public.export_queue FOR ALL USING (
    EXISTS (SELECT 1 FROM dataset_exports WHERE id = export_id AND company_id = auth.uid())
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_exports_project ON dataset_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON dataset_exports(status);
CREATE INDEX IF NOT EXISTS idx_versions_project ON dataset_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON export_queue(completed_at) WHERE completed_at IS NULL;
