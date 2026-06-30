-- Monitoring and Analytics for XUM AI
-- Version: 1.0

-- 1. Admin Dashboard View
-- Aggregates real-time health metrics for the platform.
CREATE OR REPLACE VIEW public.admin_dashboard_metrics AS
SELECT
  (SELECT COUNT(*) FROM public.users WHERE is_active = true) AS active_users,
  (SELECT COUNT(*) FROM public.tasks WHERE status = 'active') AS active_tasks,
  (SELECT COUNT(*) FROM public.submissions WHERE status = 'pending') AS pending_reviews,
  (SELECT SUM(amount) FROM public.withdrawals WHERE status = 'pending') AS pending_payouts_volume,
  (SELECT COUNT(*) FROM public.submissions WHERE is_flagged = true) AS flagged_submissions,
  (SELECT AVG(trust_score) FROM public.users WHERE role = 'contributor') AS avg_contributor_trust_score,
  (SELECT SUM(balance) FROM public.users) AS total_platform_liability;

-- 2. Fraud Detection
-- Identifies suspicious contributors based on speed, quality, and patterns.
CREATE OR REPLACE FUNCTION public.detect_suspicious_users()
RETURNS TABLE (
  user_id UUID,
  full_name VARCHAR,
  issue VARCHAR,
  details TEXT
) AS $$
BEGIN
  -- Pattern 1: Bot-like speed (>15 submissions in 1 hour)
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    'High-speed submissions'::VARCHAR,
    'User submitted ' || COUNT(s.id) || ' tasks in the last hour.' AS details
  FROM public.users u
  INNER JOIN public.submissions s ON s.user_id = u.id
  WHERE s.submitted_at > now() - INTERVAL '1 hour'
  GROUP BY u.id, u.full_name
  HAVING COUNT(s.id) > 15;
  
  -- Pattern 2: Quality collapse (<40% approval on last 20 tasks)
  RETURN QUERY
  SELECT
    u.id,
    u.full_name,
    'Low approval rate'::VARCHAR,
    'Approval rate is ' || ROUND((stats.approved::DECIMAL / NULLIF(stats.total, 0) * 100), 2) || '% over ' || stats.total || ' submissions.' AS details
  FROM public.users u
  CROSS JOIN LATERAL (
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'approved') AS approved
    FROM public.submissions
    WHERE user_id = u.id
    AND submitted_at > now() - INTERVAL '7 days'
  ) stats
  WHERE stats.total > 10 AND (stats.approved::DECIMAL / stats.total) < 0.4;
  
  -- Pattern 3: Withdrawal spamming (>3 requests in 24 hours)
  RETURN QUERY
  SELECT
    u.id,
    u.full_name,
    'Withdrawal spam'::VARCHAR,
    COUNT(w.id) || ' withdrawal requests in 24 hours.' AS details
  FROM public.users u
  INNER JOIN public.withdrawals w ON w.user_id = u.id
  WHERE w.requested_at > now() - INTERVAL '24 hours'
  GROUP BY u.id, u.full_name
  HAVING COUNT(w.id) > 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
