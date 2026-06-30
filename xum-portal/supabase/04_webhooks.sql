-- Webhook & Notification System for Companies
-- Version: 1.0
-- Allows companies to receive real-time updates on project progress

-- 1. Webhook Endpoints (Company-registered URLs)
CREATE TABLE IF NOT EXISTS public.company_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Endpoint Configuration
    url TEXT NOT NULL,
    secret_hash TEXT, -- For HMAC signature verification
    
    -- Event Subscriptions
    events TEXT[] DEFAULT ARRAY['project.completed', 'submission.approved'],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Webhook Event Log (Delivery tracking)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES public.company_webhooks(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'retrying'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    
    -- Response
    response_status INTEGER,
    response_body TEXT,
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    sent_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'retrying'))
);

-- 3. Supported Event Types
COMMENT ON TABLE public.webhook_events IS 'Supported event_type values:
- project.created
- project.activated  
- project.progress.25
- project.progress.50
- project.progress.75
- project.completed
- submission.approved
- submission.flagged
- export.ready
- budget.low (< 20% remaining)
- budget.depleted';

-- 4. Function: Queue Webhook Event
CREATE OR REPLACE FUNCTION queue_webhook_event(
    p_company_id UUID,
    p_event_type VARCHAR,
    p_payload JSONB
)
RETURNS VOID
AS $$
DECLARE
    v_webhook RECORD;
BEGIN
    -- Find all active webhooks for this company that subscribe to this event
    FOR v_webhook IN 
        SELECT id 
        FROM company_webhooks 
        WHERE company_id = p_company_id 
          AND is_active = true 
          AND p_event_type = ANY(events)
    LOOP
        INSERT INTO webhook_events (webhook_id, company_id, event_type, payload)
        VALUES (v_webhook.id, p_company_id, p_event_type, p_payload);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: Notify on Project Progress Milestones
CREATE OR REPLACE FUNCTION trigger_project_progress_webhook()
RETURNS TRIGGER AS $$
DECLARE
    v_progress DECIMAL;
    v_old_progress DECIMAL;
BEGIN
    -- Calculate progress percentage
    v_progress := (NEW.budget_spent / NULLIF(NEW.budget_limit, 0)) * 100;
    v_old_progress := (OLD.budget_spent / NULLIF(OLD.budget_limit, 0)) * 100;
    
    -- Check milestones
    IF v_old_progress < 25 AND v_progress >= 25 THEN
        PERFORM queue_webhook_event(NEW.company_id, 'project.progress.25', 
            jsonb_build_object('project_id', NEW.id, 'title', NEW.title, 'progress', 25));
    END IF;
    
    IF v_old_progress < 50 AND v_progress >= 50 THEN
        PERFORM queue_webhook_event(NEW.company_id, 'project.progress.50', 
            jsonb_build_object('project_id', NEW.id, 'title', NEW.title, 'progress', 50));
    END IF;
    
    IF v_old_progress < 75 AND v_progress >= 75 THEN
        PERFORM queue_webhook_event(NEW.company_id, 'project.progress.75', 
            jsonb_build_object('project_id', NEW.id, 'title', NEW.title, 'progress', 75));
    END IF;
    
    IF v_old_progress < 100 AND v_progress >= 100 THEN
        PERFORM queue_webhook_event(NEW.company_id, 'project.completed', 
            jsonb_build_object('project_id', NEW.id, 'title', NEW.title, 'progress', 100));
    END IF;
    
    -- Low budget warning
    IF v_progress >= 80 AND v_old_progress < 80 THEN
        PERFORM queue_webhook_event(NEW.company_id, 'budget.low', 
            jsonb_build_object('project_id', NEW.id, 'remaining_percent', 100 - v_progress));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_project_progress ON projects;
CREATE TRIGGER on_project_progress
    AFTER UPDATE ON projects
    FOR EACH ROW
    WHEN (OLD.budget_spent IS DISTINCT FROM NEW.budget_spent)
    EXECUTE FUNCTION trigger_project_progress_webhook();

-- 6. RLS Policies
ALTER TABLE public.company_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage own webhooks" ON public.company_webhooks FOR ALL USING (auth.uid() = company_id);
CREATE POLICY "Companies can view own webhook events" ON public.webhook_events FOR SELECT USING (auth.uid() = company_id);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_company ON company_webhooks(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_webhook_events_company ON webhook_events(company_id);
