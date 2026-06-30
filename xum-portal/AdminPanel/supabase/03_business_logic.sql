-- Business Logic Functions for XUM AI
-- Version: 1.0

-- 1. Task Feed Distribution
-- Returns a list of tasks tailored for the user based on level, trust score, and priority.
CREATE OR REPLACE FUNCTION public.get_user_task_feed(
  p_user_id UUID,
  p_task_type VARCHAR DEFAULT NULL,
  p_difficulty VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  task_type VARCHAR,
  difficulty VARCHAR,
  reward DECIMAL,
  xp_reward INTEGER,
  time_estimate VARCHAR,
  is_priority BOOLEAN,
  priority_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.task_type,
    t.difficulty,
    t.reward,
    t.xp_reward,
    t.time_estimate,
    t.is_priority,
    (
      CASE WHEN t.is_priority THEN 10.0 ELSE 0.0 END +
      (10.0 - (t.current_submissions::DECIMAL / NULLIF(t.max_submissions, 0) * 10.0)) +
      (t.reward / 10.0)
    ) AS priority_score
  FROM public.tasks t
  INNER JOIN public.users u ON u.id = p_user_id
  WHERE t.status = 'active'
    AND t.current_submissions < t.max_submissions
    AND u.trust_score >= t.min_trust_score
    AND u.level >= t.min_level
    AND (t.deadline IS NULL OR t.deadline > now())
    AND (p_task_type IS NULL OR t.task_type = p_task_type)
    AND (p_difficulty IS NULL OR t.difficulty = p_difficulty)
  ORDER BY priority_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atomic Reward Processing
-- Handles the complex task of updating balances, XP, levels, and creating transaction records.
CREATE OR REPLACE FUNCTION public.process_task_reward(
  p_user_id UUID,
  p_submission_id UUID,
  p_reward DECIMAL,
  p_xp INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_new_balance DECIMAL;
  v_new_xp INTEGER;
  v_target_xp INTEGER;
  v_current_level INTEGER;
BEGIN
  -- Mark submission as approved first
  UPDATE public.submissions
  SET 
    status = 'approved',
    reviewed_at = now(),
    review_status = 'auto_approved'
  WHERE id = p_submission_id;

  -- Update user balance, earnings, and XP
  UPDATE public.users
  SET 
    balance = balance + p_reward,
    total_earned = total_earned + p_reward,
    current_xp = current_xp + p_xp,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING balance, current_xp, target_xp, level 
  INTO v_new_balance, v_new_xp, v_target_xp, v_current_level;
  
  -- Handle potential Level Up
  IF v_new_xp >= v_target_xp THEN
    UPDATE public.users
    SET 
      level = level + 1,
      current_xp = v_new_xp - v_target_xp,
      target_xp = target_xp + 50 -- Scaling XP requirements
    WHERE id = p_user_id;
    
    -- Notify user about Level Up
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      p_user_id,
      'Level Up! 🎉',
      'You reached Level ' || (v_current_level + 1),
      'achievement_unlocked'
    );
  END IF;
  
  -- Record the transaction
  INSERT INTO public.transactions (user_id, type, amount, balance_after, submission_id, description)
  VALUES (
    p_user_id,
    'earning',
    p_reward,
    v_new_balance,
    p_submission_id,
    'Task completion reward'
  );
  
  -- Increment task submission count globally
  UPDATE public.tasks
  SET current_submissions = current_submissions + 1
  WHERE id = (SELECT task_id FROM public.submissions WHERE id = p_submission_id);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error processing reward: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Withdrawal Request with Escrow
-- Deducts funds from balance and creates a pending withdrawal record.
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_user_id UUID,
  p_amount DECIMAL,
  p_method VARCHAR,
  p_account_details JSONB
)
RETURNS UUID AS $$
DECLARE
  v_withdrawal_id UUID;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- Validate threshold
  IF p_amount < 5.00 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is $5.00';
  END IF;
  
  -- Atomic check and lock
  SELECT balance INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: $%, Requested: $%', v_current_balance, p_amount;
  END IF;
  
  -- Deduct Immediately (Escrow)
  UPDATE public.users
  SET balance = balance - p_amount,
      total_withdrawn = total_withdrawn + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create Record
  INSERT INTO public.withdrawals (user_id, amount, method, account_details, status)
  VALUES (p_user_id, p_amount, p_method, p_account_details, 'pending')
  RETURNING id INTO v_withdrawal_id;
  
  -- Transaction Ledger entry
  INSERT INTO public.transactions (user_id, type, amount, balance_after, withdrawal_id, description)
  VALUES (
    p_user_id,
    'withdrawal',
    -p_amount,
    v_new_balance,
    v_withdrawal_id,
    'Withdrawal request (' || p_method || ')'
  );
  
  -- Confirm with Notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Withdrawal Pending',
    'Your withdrawal request for $' || p_amount || ' has been received.',
    'withdrawal_processed'
  );
  
  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
