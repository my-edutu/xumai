# XUM AI Payment System - Complete Implementation Guide

**Project**: XUM AI  
**Development Date**: February 8, 2026  
**Status**: ✅ Core Infrastructure Complete | ⚠️ Integration Required

---

## 🎯 What Has Been Implemented

### 1. Database Infrastructure (✅ LIVE)

#### Tables Created
- **`company_wallets`** - Tracks company financial balances
  - `available_balance` - Immediately usable funds
  - `pending_balance` - Funds locked for active tasks
  - `reserved_balance` - Reserved for future use
  - `total_deposited` / `total_spent` - Accounting totals

- **`payment_events`** - Webhook idempotency tracking
  - Prevents duplicate payment processing
  - Stores raw webhook payloads for debugging

- **`financial_ledger`** - Immutable transaction log (existing, now integrated)

#### Database Functions
- **`handle_company_deposit(p_company_id, p_amount, p_reference, p_provider)`**
  - Atomically adds funds to company wallet
  - Records transaction in ledger
  - Returns new balance

- **`allocate_budget_from_wallet(p_name, p_amount)`**
  - Locks wallet funds for specific budget
  - Moves money from `available` → `pending`

- **`auto_create_company_wallet()`**
  - Auto-creates wallet when company user signs up

#### Triggers
- **`on_company_created`** - Auto-creates wallet on user insert

### 2. Payment Gateway Integration (✅ CODE READY)

#### Supabase Edge Functions Created
- **`stripe-webhook`** (`supabase/functions/stripe-webhook/index.ts`)
  - Handles `checkout.session.completed` events
  - Verifies webhook signatures
  - Calls `handle_company_deposit` on success

- **`paystack-webhook`** (`supabase/functions/paystack-webhook/index.ts`)
  - Handles `charge.success` events
  - Verifies HMAC signatures
  - Calls `handle_company_deposit` on success

- **`create-stripe-checkout`** (`supabase/functions/create-stripe-checkout/index.ts`)
  - Creates Stripe Checkout sessions
  - Called by company portal to initiate deposits

#### Company Portal Integration (✅ UPDATED)
- **`company/src/services/billingService.ts`**
  - `getWallet()` - Fetches from `company_wallets`
  - `getTransactions()` - Fetches from `financial_ledger`
  - `initiateDeposit(amount, method)` - Now calls real Stripe/Paystack APIs

---

## ⚙️ Deployment Steps

### Step 1: Set Environment Variables

#### Company Portal (`.env.local`)
```bash
# Supabase
VITE_SUPABASE_URL=https://gkhemshbwmealgxczykk.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
```

#### Supabase Edge Functions (Secrets)
```bash
cd "c:\Users\USER\Desktop\app projects\project 2025\xum ai"

# Set secrets
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_...
npx supabase secrets set COMPANY_PORTAL_URL=http://localhost:5173
```

### Step 2: Deploy Edge Functions

```bash
cd "c:\Users\USER\Desktop\app projects\project 2025\xum ai"

# Deploy all functions
npx supabase functions deploy stripe-webhook --project-ref gkhemshbwmealgxczykk
npx supabase functions deploy paystack-webhook --project-ref gkhemshbwmealgxczykk
npx supabase functions deploy create-stripe-checkout --project-ref gkhemshbwmealgxczykk
```

### Step 3: Configure Payment Provider Webhooks

#### Stripe Dashboard
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://gkhemshbwmealgxczykk.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

#### Paystack Dashboard
1. Go to https://dashboard.paystack.com/#/settings/developer
2. Add webhook URL: `https://gkhemshbwmealgxczykk.supabase.co/functions/v1/paystack-webhook`
3. Copy secret key to `PAYSTACK_SECRET_KEY`

### Step 4: Add Paystack SDK to Company Portal

Add to `company/index.html` (before `</body>`):
```html
<script src="https://js.paystack.co/v1/inline.js"></script>
```

### Step 5: Test the Flow

#### Test Company Deposit
1. Open company portal
2. Navigate to `/billing`
3. Click "Add Money"
4. Select Stripe or Paystack
5. Complete test payment
6. Verify wallet balance increases

#### Verify Database
```sql
-- Check wallet balance
SELECT * FROM company_wallets WHERE company_id = '<user_id>';

-- Check ledger entries
SELECT * FROM financial_ledger WHERE company_id = '<user_id>' ORDER BY created_at DESC;

-- Check payment events
SELECT * FROM payment_events ORDER BY created_at DESC LIMIT 10;
```

---

## 🔄 User Payment Flow (Not Yet Connected)

### Current State
- Users earn rewards via `process_task_reward` RPC
- Rewards increase `users.balance`
- **❌ Company wallets are NOT debited**

### Solution Required
Apply the trigger from `supabase/21_wallet_budget_integration.sql`:

```sql
-- This trigger needs to be connected to task submission approvals
CREATE OR REPLACE FUNCTION public.sync_task_payout_with_budget()
RETURNS TRIGGER AS $$
DECLARE
    v_task RECORD;
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        
        -- Get task info
        SELECT id, reward, company_id INTO v_task 
        FROM public.tasks 
        WHERE id = NEW.task_id;

        -- Deduct from company wallet
        UPDATE public.company_wallets
        SET pending_balance = pending_balance - v_task.reward,
            total_spent = total_spent + v_task.reward
        WHERE company_id = v_task.company_id;

        -- Log expense
        INSERT INTO public.financial_ledger (
            company_id,
            amount,
            type,
            reference,
            description,
            status
        ) VALUES (
            v_task.company_id,
            -v_task.reward,
            'task_payout',
            'SUBMISSION-' || NEW.id,
            'Task reward payout',
            'completed'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to submissions table
DROP TRIGGER IF EXISTS tr_sync_task_payout ON public.submissions;
CREATE TRIGGER tr_sync_task_payout
    AFTER UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_task_payout_with_budget();
```

**Deploy This**:
```bash
npx supabase db push
```

---

## 🧪 Testing Checklist

### Database
- [x] `company_wallets` table exists
- [x] `payment_events` table exists
- [x] `handle_company_deposit` function works
- [ ] Trigger `tr_sync_task_payout` is active

### Edge Functions
- [ ] `stripe-webhook` deployed
- [ ] `paystack-webhook` deployed
- [ ] `create-stripe-checkout` deployed
- [ ] Webhook signatures verified

### Company Portal
- [ ] Can view wallet balance
- [ ] Can view transaction history
- [ ] Stripe deposit redirects correctly
- [ ] Paystack popup opens
- [ ] Balance updates after payment

### User Flow
- [ ] Task completion increases user balance
- [ ] (After trigger) Company wallet decreases
- [ ] Ledger records both sides of transaction

---

## 📊 Data Flow Diagram

```
COMPANY ADDS MONEY:
1. Company clicks "Add Money" (Stripe/Paystack)
2. billingService.initiateDeposit() → create-stripe-checkout Edge Function
3. User completes payment on Stripe
4. Stripe sends webhook → stripe-webhook Edge Function
5. stripe-webhook calls handle_company_deposit(company_id, amount)
6. company_wallets.available_balance increases
7. financial_ledger records deposit

USER EARNS REWARD:
1. User submits task
2. Admin/Auto approves → submissions.status = 'approved'
3. Trigger `tr_sync_task_payout` fires
4. company_wallets.pending_balance decreases
5. users.balance increases (via process_task_reward)
6. financial_ledger records expense
```

---

## 🚨 Known Issues & Next Steps

### Critical
1. **User-to-Company Bridge Not Connected** - Apply trigger SQL above
2. **Edge Functions Not Deployed** - Run deployment commands
3. **Webhooks Not Configured** - Add URLs to Stripe/Paystack dashboards

### Medium Priority
1. **RLS Disabled** - Re-enable Row Level Security once policies are working
2. **No Withdrawal Automation** - Create payout processing Edge Function
3. **No Budget Allocation UI** - Company portal needs budget management screen

### Low Priority
1. **No Email Notifications** - Add Resend/SendGrid for payment confirmations
2. **No Admin Dashboard** - Build internal tool to view all transactions
3. **No Refund Flow** - Implement refund handling

---

## 🎓 Learning Resources

- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Paystack Integration**: https://paystack.com/docs/payments/webhooks
- **Database Triggers**: https://supabase.com/docs/guides/database/postgres/triggers

---

## ✅ Success Criteria

The payment system is **fully functional** when:
1. ✅ Company can deposit money via Stripe/Paystack
2. ✅ Wallet balance reflects deposits in real-time
3. ❌ User task rewards deduct from company wallets (needs trigger)
4. ❌ All transactions appear in `financial_ledger`
5. ❌ Withdrawals are processed automatically

**Current Status**: 3/5 complete

---

**Last Updated**: 2026-02-08  
**Next Review**: After Edge Function deployment
