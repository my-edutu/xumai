# Task-to-Wallet Sync Trigger - Implementation Complete

**Date**: 2026-02-08 12:26  
**Status**: ✅ ACTIVE

---

## What Was Implemented

### Trigger Function: `sync_task_payout_with_budget()`

**Purpose**: Automatically deducts task rewards from company wallets when user submissions are approved.

**How It Works**:
1. Fires **before** a `task_submissions` row is updated to status='approved'
2. Retrieves the prompt's creator (company) via `prompts.created_by`
3. Checks if the company has a wallet in `company_wallets`
4. Deducts `total_reward` from company's `pending_balance`
5. Increments company's `total_spent`
6. Records the expense in `financial_ledger`
7. Marks the submission's `reward_paid` flag as `true`

**Safety Features**:
- Only processes `pending` → `approved` status changes
- Checks if reward has already been paid (`reward_paid = false`)
- Uses `GREATEST(0, ...)` to prevent negative balances
- Logs NOTICE messages for debugging
- Gracefully handles companies without wallets

---

## Database Objects Created

### 1. Function
```sql
CREATE FUNCTION public.sync_task_payout_with_budget()
RETURNS TRIGGER
```

### 2. Trigger
```sql
CREATE TRIGGER tr_sync_task_payout 
    BEFORE UPDATE ON public.task_submissions
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
    EXECUTE FUNCTION public.sync_task_payout_with_budget();
```

---

## Data Flow

```
USER COMPLETES TASK:
1. User submits task → task_submissions.status = 'pending'
2. Admin/Auto approves → UPDATE task_submissions SET status = 'approved'
3. ⚡ Trigger fires BEFORE update
4. Get prompt.created_by (company ID)
5. Deduct from company_wallets.pending_balance
6. Add to company_wallets.total_spent
7. Record in financial_ledger (type='task_payout')
8. Set reward_paid = true
9. User balance increases (via existing process_task_reward RPC)
```

---

## Testing

### Test Case 1: Manual Approval Simulation
```sql
-- Setup: Create test company with wallet
INSERT INTO users (id, email, full_name, role)
VALUES ('test-company-123', 'company@test.com', 'Test Company', 'company')
ON CONFLICT (id) DO NOTHING;

INSERT INTO company_wallets (company_id, available_balance, pending_balance)
VALUES ('test-company-123', 0, 100.00)
ON CONFLICT (company_id) DO UPDATE SET pending_balance = 100.00;

-- Create test prompt
INSERT INTO prompts (created_by, text, language, status)
VALUES ('test-company-123', 'Test prompt', 'en', 'active')
RETURNING id;

-- Create test submission (use the prompt id from above)
INSERT INTO task_submissions (
    user_id, prompt_id, task_type, status, 
    base_reward, bonus_reward, total_reward, reward_paid
)
VALUES (
    'test-user-456', '<prompt_id_from_above>', 'recording', 'pending',
    5.00, 0.00, 5.00, false
)
RETURNING id;

-- Simulate approval (THIS WILL TRIGGER THE SYNC)
UPDATE task_submissions 
SET status = 'approved'
WHERE id = '<submission_id_from_above>';

-- Verify wallet was debited
SELECT * FROM company_wallets WHERE company_id = 'test-company-123';
-- Expected: pending_balance = 95.00, total_spent = 5.00

-- Verify ledger entry
SELECT * FROM financial_ledger 
WHERE company_id = 'test-company-123'::uuid 
ORDER BY created_at DESC LIMIT 1;
-- Expected: type='task_payout', amount=-5.00
```

### Test Case 2: Production Monitoring
```sql
-- Monitor trigger activity in real-time
SELECT 
    ts.id,
    ts.status,
    ts.total_reward,
    ts.reward_paid,
    p.created_by as company_id,
    cw.pending_balance
FROM task_submissions ts
JOIN prompts p ON p.id = ts.prompt_id
LEFT JOIN company_wallets cw ON cw.company_id = p.created_by
WHERE ts.status = 'approved'
AND ts.created_at > now() - interval '1 hour'
ORDER BY ts.created_at DESC
LIMIT 10;
```

---

## Edge Cases Handled

### 1. Company Without Wallet
**Scenario**: Prompt created before company_wallets table existed  
**Behavior**: Trigger logs NOTICE and skips deduction (doesn't fail)

### 2. Insufficient Pending Balance
**Scenario**: Company's pending_balance < total_reward  
**Behavior**: Sets pending_balance to 0 using `GREATEST(0, ...)`  
**Note**: This indicates a budget allocation issue that should be investigated

### 3. Double-Approval Prevention
**Scenario**: Submission approved twice (edge case bug)  
**Behavior**: `reward_paid = true` check prevents double-deduction

### 4. Status Change Not Pending→Approved
**Scenario**: Direct insert with status='approved' OR rejected→approved  
**Behavior**: Trigger condition `OLD.status = 'pending'` prevents execution

---

## Integration Points

### Updates Required in Other Systems

#### 1. Budget Allocation (Future Enhancement)
When companies allocate budgets for prompts, funds should move:
```sql
-- Move funds: available → pending
UPDATE company_wallets
SET available_balance = available_balance - budget_amount,
    pending_balance = pending_balance + budget_amount
WHERE company_id = ...;
```

#### 2. User Reward Processing (Existing)
The existing `process_task_reward` RPC handles user balance increases.  
**Important**: This trigger complements it by handling the company side.

#### 3. Withdrawal Prevention (Recommended)
Add constraint to prevent companies from withdrawing more than available:
```sql
ALTER TABLE company_wallets 
ADD CONSTRAINT positive_available_balance 
CHECK (available_balance >= 0);
```

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Negative Balances** (shouldn't happen, but monitor):
```sql
SELECT company_id, pending_balance 
FROM company_wallets 
WHERE pending_balance < 0;
```

2. **Unpaid Approved Submissions** (indicates trigger failure):
```sql
SELECT COUNT(*) 
FROM task_submissions 
WHERE status = 'approved' 
AND reward_paid = false 
AND created_at < now() - interval '1 hour';
```

3. **Ledger-Wallet Mismatch** (reconciliation check):
```sql
SELECT 
    cw.company_id,
    cw.total_spent as wallet_total_spent,
    COALESCE(SUM(ABS(fl.amount)), 0) as ledger_total_spent
FROM company_wallets cw
LEFT JOIN financial_ledger fl ON fl.company_id = cw.company_id::uuid 
    AND fl.type = 'task_payout'
GROUP BY cw.company_id, cw.total_spent
HAVING cw.total_spent != COALESCE(SUM(ABS(fl.amount)), 0);
```

---

## Rollback Plan

If the trigger causes issues:

```sql
-- Disable trigger (keeps function intact)
ALTER TABLE task_submissions DISABLE TRIGGER tr_sync_task_payout;

-- Re-enable trigger
ALTER TABLE task_submissions ENABLE TRIGGER tr_sync_task_payout;

-- Complete removal
DROP TRIGGER IF EXISTS tr_sync_task_payout ON task_submissions;
DROP FUNCTION IF EXISTS sync_task_payout_with_budget();
```

---

## Performance Impact

**Expected**: Minimal  
- Trigger executes on `BEFORE UPDATE` (blocking)
- Average execution: ~5-10ms (2 reads, 2 writes)
- Only fires on status change to 'approved'
- No N+1 queries or complex joins

**Recommendation**: Monitor slow query logs for the first 24h after deployment.

---

## Next Steps

1. ✅ **Trigger is ACTIVE** - No action needed
2. 🔍 **Monitor for 24h** - Check for errors in Supabase logs
3. 📊 **Run reconciliation query** (see Monitoring section above)
4. 🎯 **Implement budget allocation** when companies create prompts
5. 🔒 **Enable RLS policies** on company_wallets once tested

---

## Success Criteria

The trigger is working correctly when:
- ✅ Approved submissions have `reward_paid = true`
- ✅ `company_wallets.pending_balance` decreases by exact `total_reward`
- ✅ `financial_ledger` contains matching `task_payout` entries
- ✅ No negative balances in `company_wallets`
- ✅ Trigger logs appear in Supabase function logs

---

**Status**: ✅ DEPLOYED AND ACTIVE  
**Last Updated**: 2026-02-08 12:26  
**Deployed By**: Antigravity AI Agent
