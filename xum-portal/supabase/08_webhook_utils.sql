-- Webhook Utilities
-- Version: 1.1

CREATE OR REPLACE FUNCTION increment_webhook_failures(p_webhook_id UUID)
RETURNS VOID
AS $$
BEGIN
    UPDATE company_webhooks
    SET 
        failure_count = failure_count + 1,
        last_failure_at = now(),
        is_active = CASE WHEN failure_count + 1 >= 10 THEN false ELSE true END
    WHERE id = p_webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically call edge function when a new webhook event is queued
-- In a real Supabase environment, we'd use pg_net.http_post
-- For this demonstration, we'll just prepare the trigger logic

-- Ensure pg_net is available if possible, or use a background worker
-- CREATE EXTENSION IF NOT EXISTS pg_net;
