# Payment System Implementation Status

**Date**: 2026-02-08  
**Project**: XUM AI  
**Supabase Project ID**: `gkhemshbwmealgxczykk`

---

## ✅ COMPLETED: Database Infrastructure

### 1. Company Wallets Table
**Status**: ✅ Created
- Table: `public.company_wallets`
- Columns: `id`, `company_id`, `available_balance`, `pending_balance`, `reserved_balance`, `total_deposited`, `total_spent`, `currency`, `created_at`, `updated_at`
- Index: `idx_company_wallets_company_id`

### 2. Payment Events Table  
**Status**: ✅ Created
- Table: `public.payment_events`
- Purpose: Idempotency tracking for payment gateway webhooks
- Unique constraint on `(provider, provider_event_id)`

### 3. Financial Ledger Enhancements
**Status**: ✅ Existing table verified
- Table: `public.financial_ledger` (already exists)
- Contains: `company_id`, `amount`, `type`, `status`, `reference`, `description`, `created_at`

### 4. Database Functions Created
**Status**: ✅ All functions deployed

#### `handle_company_deposit(p_company_id, p_amount, p_reference, p_provider)`
- Atomically adds funds to company wallet
- Records transaction in financial ledger
- Returns JSON with success status and new balance

#### `allocate_budget_from_wallet(p_name, p_amount)`
- Locks wallet funds into escrow for a specific budget
- Moves funds from `available_balance` → `pending_balance`
- Returns budget ID for tracking

#### `auto_create_company_wallet()`
- Trigger function that auto-creates company wallets when role='company' user is created

### 5. Triggers
**Status**: ✅ Active

#### `on_company_created` (ON users table)
- Automatically creates wallet when company user signs up

---

## ⚠️ TODO: Critical Integration Work

### 1. Frontend Company Portal Updates
**Location**: `company/src/services/billingService.ts`

**Current State**: Mock implementation  
**Needs**:
- Replace mock `initiateDeposit` with real Stripe/Paystack integration
- Update `getWallet()` to query `company_wallets` table (currently working)
- Update `getTransactions()` to query `financial_ledger` table (currently working)

**Example Fix**:
```typescript
async initiateDeposit(amount: number, method: 'stripe' | 'paystack') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create billing request
    const { data: request, error } = await supabase
        .from('billing_requests')
        .insert({
            company_id: user.id,
            amount,
            currency: 'USD',
            type: 'deposit',
            status: 'pending',
            payment_method: method
        })
        .select()
        .single();

    if (error) throw error;

    // TODO: Redirect to actual Stripe/Paystack checkout
    if (method === 'stripe') {
        // window.location.href = stripeCheckoutUrl;
    } else if (method === 'paystack') {
        // PaystackPop.setup({ ... }).openIframe();
    }

    return { success: true, requestId: request.id };
}
```

### 2. Supabase Edge Functions for Webhooks
**Status**: ❌ Not created yet  
**Needed**:
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/paystack-webhook/index.ts`

**Purpose**: Listen for payment confirmations and call `handle_company_deposit`

**Example (Stripe)**:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2022-11-15' });
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

serve(async (req) => {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET'));
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Call our deposit function
        const { data, error } = await supabase.rpc('handle_company_deposit', {
            p_company_id: session.client_reference_id, // company user ID
            p_amount: session.amount_total / 100, // Convert cents to dollars
            p_reference: session.id,
            p_provider: 'stripe'
        });

        if (error) console.error('Deposit failed:', error);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

### 3. User-to-Company Payment Flow Bridge
**Status**: ❌ Not connected

**Problem**: When a user completes a task (via `process_task_reward`), the company wallet is NOT debited.

**Solution**: Use the trigger from `21_wallet_budget_integration.sql`

**Apply this**:
```sql
CREATE OR REPLACE FUNCTION public.sync_task_payout_with_budget()
RETURNS TRIGGER AS $$
DECLARE
    v_task RECORD;
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        
        -- Get task details (assuming task_submissions has task_id)
        SELECT id, total_reward INTO v_task 
        FROM public.task_submissions 
        WHERE id = NEW.id;

        -- Deduct from company wallet (simplified - assumes platform pays)
        -- In a real system, you'd need to know which company owns this task
        UPDATE public.company_wallets
        SET pending_balance = pending_balance - v_task.total_reward,
            total_spent = total_spent + v_task.total_reward
        WHERE company_id = 'PLATFORM_COMPANY_ID'; -- Replace with actual logic

        -- Log the expense
        INSERT INTO public.financial_ledger (
            company_id,
            amount,
            type,
            reference,
            description,
            status
        ) VALUES (
            'PLATFORM_COMPANY_ID',
            -v_task.total_reward,
            'task_payout',
            'SUBMISSION-' || NEW.id,
            'Task reward payout',
            'completed'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to task_submissions table
DROP TRIGGER IF EXISTS tr_sync_task_payout ON public.task_submissions;
CREATE TRIGGER tr_sync_task_payout
    AFTER UPDATE ON public.task_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_task_payout_with_budget();
```

### 4. User Withdrawal Automation
**Status**: ❌ Manual process only

**Current**: `requestWithdrawal` creates a row in `withdrawals` table with status='pending'
**Needed**: Automated payout processing

**Next Steps**:
1. Create Edge Function: `supabase/functions/process-withdrawals/index.ts`  
2. Use Deno cron or manual trigger to process pending withdrawals
3. Integrate with PayPal Payouts API or Paystack Transfer API
4. Update withdrawal status to 'completed' or 'failed'

---

## 🔧 Environment Variables Needed

### Company Portal (`.env.local`)
```bash
VITE_SUPABASE_URL=https://gkhemshbwmealgxczykk.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
```

### Supabase Edge Functions (Secrets)
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_...
supabase secrets set PAYPAL_CLIENT_ID=...
supabase secrets set PAYPAL_SECRET=...
```

---

## 📋 Testing Checklist

### Database Functions
- [ ] Test `handle_company_deposit` with manual SQL call
- [ ] Verify wallet balance updates correctly
- [ ] Confirm ledger entries are created

### Company Portal
- [ ] Company can view wallet balance
- [ ] Company can view transaction history
- [ ] Deposit flow redirects correctly (once webhooks are set up)

### User App
- [ ] Task completion increases user balance
- [ ] (TODO) Verify company wallet decreases

### Webhooks (Once deployed)
- [ ] Stripe webhook receives events
- [ ] Paystack webhook receives events
- [ ] Idempotency prevents duplicate processing

---

## 🚀 Deployment Steps

1. **Deploy Edge Functions**:
   ```bash
   cd supabase/functions
   supabase functions deploy stripe-webhook
   supabase functions deploy paystack-webhook
   ```

2. **Configure Webhook URLs in Stripe/Paystack**:
   - Stripe: `https://gkhemshbwmealgxczykk.supabase.co/functions/v1/stripe-webhook`
   - Paystack: `https://gkhemshbwmealgxczykk.supabase.co/functions/v1/paystack-webhook`

3. **Test in Sandbox Mode** before going live

---

## 📚 Additional Resources

- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Paystack Webhooks: https://paystack.com/docs/payments/webhooks

---

## Summary

✅ **Database infrastructure is ready**  
⚠️ **Frontend needs real payment provider integration**  
❌ **Edge Functions for webhooks need to be created**  
❌ **User-to-Company payment bridge needs connection**  

**Next Immediate Step**: Create Stripe/Paystack webhook Edge Functions to enable real deposits.
