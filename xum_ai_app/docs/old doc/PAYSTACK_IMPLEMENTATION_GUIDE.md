# Paystack Integration - Complete Implementation Guide

**Project**: XUM AI  
**Payment Provider**: Paystack  
**Date**: 2026-02-08  
**Estimated Time**: 30-45 minutes

---

## 📋 Overview

This guide will take you through implementing Paystack payments in your XUM AI company portal, step by step. By the end, companies will be able to deposit money into their wallets using Paystack.

**What You'll Implement**:
1. Get Paystack API keys
2. Deploy Paystack webhook Edge Function
3. Configure Paystack webhook URL
4. Add Paystack SDK to company portal
5. Test with Paystack test cards
6. Monitor transactions

---

## 🎯 Prerequisites

- [ ] Paystack account created at https://paystack.com
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Company portal running locally
- [ ] Node.js and npm installed

---

## STEP 1: Get Paystack API Keys (5 minutes)

### 1.1 Create Paystack Account
1. Go to https://paystack.com
2. Click **Sign Up** (if you don't have an account)
3. Verify your email
4. Complete KYC (for live mode later)

### 1.2 Get Test API Keys
1. Log in to https://dashboard.paystack.com
2. Click on **Settings** (left sidebar)
3. Click on **API Keys & Webhooks**
4. You'll see two sets of keys:
   - **Test Keys** (for development)
   - **Live Keys** (for production - requires KYC)

**Copy these values** (we'll use Test keys first):
```
Public Key (Test): pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret Key (Test): sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **SECURITY NOTE**: Never commit secret keys to Git!

---

## STEP 2: Deploy Paystack Webhook Edge Function (10 minutes)

### 2.1 Login to Supabase CLI

Open your terminal in the project root:

```bash
cd "c:\Users\USER\Desktop\app projects\project 2025\xum ai"

# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project
npx supabase link --project-ref gkhemshbwmealgxczykk
```

You'll be prompted to enter your Supabase database password.

### 2.2 Set Paystack Secret Key

```bash
# Set Paystack secret key (use your actual test key from Step 1.2)
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_actual_key_here

# Verify it was set
npx supabase secrets list
```

You should see `PAYSTACK_SECRET_KEY` in the list.

### 2.3 Deploy the Webhook Function

```bash
# Deploy Paystack webhook
npx supabase functions deploy paystack-webhook --project-ref gkhemshbwmealgxczykk
```

Expected output:
```
✓ Deployed Function paystack-webhook
Function URL: https://gkhemshbwmealgxczykk.supabase.co/functions/v1/paystack-webhook
```

**Copy this URL** - you'll need it in Step 3!

### 2.4 Verify Deployment

```bash
# Check function logs
npx supabase functions logs paystack-webhook --project-ref gkhemshbwmealgxczykk
```

---

## STEP 3: Configure Paystack Webhook (5 minutes)

### 3.1 Add Webhook URL to Paystack

1. Go to https://dashboard.paystack.com
2. Click **Settings** → **API Keys & Webhooks**
3. Scroll to **Webhook URL** section
4. Click **Add Webhook URL**
5. Enter your Edge Function URL:
   ```
   https://gkhemshbwmealgxczykk.supabase.co/functions/v1/paystack-webhook
   ```
6. Click **Save**

### 3.2 Test Webhook Connection

Paystack will automatically send a test payload to verify the URL works.

**Expected Result**: Green checkmark ✅ next to your webhook URL

**If you see an error**:
- Check the Edge Function logs: `npx supabase functions logs paystack-webhook`
- Verify the URL is correct
- Ensure the function deployed successfully

---

## STEP 4: Add Paystack SDK to Company Portal (5 minutes)

### 4.1 Update Company Portal HTML

Open `company/index.html` and add the Paystack SDK **before the closing `</body>` tag**:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>XUM Company Portal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    
    <!-- Add Paystack SDK here -->
    <script src="https://js.paystack.co/v1/inline.js"></script>
  </body>
</html>
```

### 4.2 Update Environment Variables

Create or update `company/.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://gkhemshbwmealgxczykk.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Paystack (use Test key from Step 1.2)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

**Where to find `VITE_SUPABASE_ANON_KEY`**:
1. Go to https://supabase.com/dashboard/project/gkhemshbwmealgxczykk/settings/api
2. Copy the `anon` `public` key

### 4.3 Restart Company Portal Dev Server

```bash
cd company

# Install dependencies (if not already)
npm install

# Start dev server
npm run dev
```

The server should start at http://localhost:5173

---

## STEP 5: Deploy create-stripe-checkout Function (Optional - 5 minutes)

Even though we're using Paystack, the billing service references a Stripe checkout function. Let's create a simplified version or you can remove that part. Let me update the billing service to remove Stripe dependency:

### 5.1 Update Billing Service (Paystack Only)

Open `company/src/services/billingService.ts` and replace the `initiateDeposit` function:

```typescript
async initiateDeposit(amount: number, method: 'stripe' | 'paystack') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create a billing request for tracking
    const { data: request, error: reqError } = await supabase
        .from('billing_requests')
        .insert({
            company_id: user.id,
            amount,
            currency: 'NGN', // Changed to NGN for Paystack
            type: 'deposit',
            status: 'pending',
            payment_method: method,
            reference_id: `DEP-${Math.random().toString(36).substring(7).toUpperCase()}`
        })
        .select()
        .single();

    if (reqError) throw reqError;

    if (method === 'paystack') {
        // Initialize Paystack Popup
        // @ts-ignore - PaystackPop is loaded via script tag
        const handler = window.PaystackPop?.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: amount * 100, // Convert to kobo (NGN) or cents
            currency: 'NGN', // Use NGN for Nigeria, USD for international
            ref: request.reference_id,
            metadata: {
                company_id: user.id,
                custom_fields: []
            },
            callback: function(response: any) {
                console.log('Payment successful:', response);
                // Show success message
                alert(`Payment successful! Reference: ${response.reference}`);
                // Webhook will handle the actual deposit
                window.location.reload();
            },
            onClose: function() {
                console.log('Payment window closed');
            }
        });

        if (handler) {
            handler.openIframe();
        } else {
            throw new Error('Paystack not initialized. Please ensure the script is loaded.');
        }

        return {
            success: true,
            message: 'Opening Paystack payment...',
            requestId: request.id
        };
    }

    throw new Error('Only Paystack payment method is supported');
}
```

---

## STEP 6: Test the Integration (10 minutes)

### 6.1 Test Paystack Payment Flow

1. **Open Company Portal**: http://localhost:5173
2. **Login** with a company account (role='company')
3. **Navigate to Billing** page (`/billing`)
4. **Click "Add Money"**
5. **Enter amount**: e.g., 1000 NGN (₦10 = ~$0.01)
6. **Select Paystack**
7. **Click "Deposit"**

### 6.2 Use Paystack Test Cards

Paystack will open a popup. Use these **test card details**:

#### Successful Payment
```
Card Number: 4084 0840 8408 4081
CVV: 408
Expiry: 12/25
PIN: 0000
OTP: 123456
```

#### Failed Payment
```
Card Number: 4084 0840 8408 4082
CVV: any
Expiry: any future date
```

### 6.3 Verify the Transaction

After successful payment:

1. **Check Company Portal**: Wallet balance should increase
2. **Check Supabase Database**:
   ```sql
   -- Check wallet balance
   SELECT * FROM company_wallets WHERE company_id = 'your-company-id';
   
   -- Check ledger
   SELECT * FROM financial_ledger 
   WHERE company_id = 'your-company-id'::uuid 
   ORDER BY created_at DESC;
   
   -- Check payment events
   SELECT * FROM payment_events 
   WHERE provider = 'paystack' 
   ORDER BY created_at DESC;
   ```

3. **Check Paystack Dashboard**:
   - Go to https://dashboard.paystack.com/transactions
   - You should see the test transaction

4. **Check Edge Function Logs**:
   ```bash
   npx supabase functions logs paystack-webhook --project-ref gkhemshbwmealgxczykk
   ```
   Look for: "Processing deposit", "Deposit successful"

---

## STEP 7: Troubleshooting

### Issue 1: "Paystack not initialized" Error

**Cause**: Paystack SDK not loaded

**Fix**:
1. Check `company/index.html` has the script tag
2. Open browser console → Check for errors
3. Verify `window.PaystackPop` is defined (type in console)

### Issue 2: Webhook Not Receiving Events

**Cause**: Webhook URL not configured or incorrect

**Fix**:
1. Verify webhook URL in Paystack dashboard
2. Check Edge Function logs for errors
3. Test webhook manually:
   ```bash
   curl -X POST https://gkhemshbwmealgxczykk.supabase.co/functions/v1/paystack-webhook \
     -H "Content-Type: application/json" \
     -d '{"event":"charge.success","data":{"id":"test123"}}'
   ```

### Issue 3: Wallet Balance Not Updating

**Cause**: `handle_company_deposit` function error

**Fix**:
1. Check Edge Function logs
2. Run SQL manually:
   ```sql
   SELECT * FROM handle_company_deposit(
       'your-company-id',
       10.00,
       'TEST-REF',
       'paystack'
   );
   ```
3. Check if `company_wallets` record exists

### Issue 4: Wrong Currency

**Cause**: Using NGN when expecting USD or vice versa

**Fix**:
- Paystack in Nigeria uses **NGN** (Naira)
- Paystack internationally uses **USD**
- Update `currency` in billing request and popup to match

Current code uses NGN. To switch to USD:
```typescript
currency: 'USD',
amount: amount * 100, // USD cents
```

---

## STEP 8: Going Live (Production)

### 8.1 Complete Paystack KYC

1. Go to https://dashboard.paystack.com/settings/account
2. Complete business verification
3. Wait for approval (~24-48 hours)

### 8.2 Switch to Live Keys

1. **Get Live Keys**: Dashboard → Settings → API Keys
2. **Update Supabase Secret**:
   ```bash
   npx supabase secrets set PAYSTACK_SECRET_KEY=sk_live_your_live_key
   ```
3. **Update Company Portal `.env`**:
   ```
   VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
   ```
4. **Rebuild Company Portal**:
   ```bash
   npm run build
   ```

### 8.3 Test Live Transaction

Use a **real card** with a **small amount** (e.g., ₦100 = ~$0.10) to verify.

---

## 📊 Monitoring & Analytics

### Daily Health Checks

Run these queries in Supabase SQL Editor:

```sql
-- Today's deposits
SELECT 
    COUNT(*) as total_deposits,
    SUM(amount) as total_amount
FROM financial_ledger 
WHERE type = 'deposit' 
AND provider = 'paystack'
AND created_at > CURRENT_DATE;

-- Failed webhooks
SELECT * FROM payment_events 
WHERE provider = 'paystack' 
AND status = 'failed' 
AND created_at > now() - interval '24 hours';

-- Pending billing requests
SELECT * FROM billing_requests 
WHERE status = 'pending' 
AND created_at < now() - interval '1 hour';
```

### Paystack Dashboard

Check regularly:
- **Transactions**: https://dashboard.paystack.com/transactions
- **Settlement**: https://dashboard.paystack.com/settlements
- **Disputes**: https://dashboard.paystack.com/disputes

---

## 🎯 Success Checklist

- [ ] Paystack test keys obtained
- [ ] Webhook Edge Function deployed
- [ ] Webhook URL configured in Paystack dashboard
- [ ] Paystack SDK added to company portal
- [ ] Environment variables set
- [ ] Test payment completed successfully
- [ ] Wallet balance increased
- [ ] Ledger entry created
- [ ] Payment event recorded
- [ ] Edge Function logs show success

---

## 📚 Additional Resources

- **Paystack Docs**: https://paystack.com/docs
- **Paystack Test Cards**: https://paystack.com/docs/payments/test-payments
- **Paystack Webhooks**: https://paystack.com/docs/payments/webhooks
- **Paystack API Reference**: https://paystack.com/docs/api
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

## 🆘 Support

### Paystack Support
- Email: support@paystack.com
- Twitter: @PaystackHQ
- Live Chat: https://paystack.com (bottom right)

### Common Questions

**Q: Can I use Paystack outside Nigeria?**  
A: Yes! Paystack supports USD payments internationally. Change `currency: 'USD'` in the code.

**Q: What are Paystack fees?**  
A: 1.5% + ₦100 for Nigerian cards, 3.9% for international cards. [Full pricing](https://paystack.com/pricing)

**Q: How long do settlements take?**  
A: T+1 for Nigerian banks (next business day)

**Q: Can I test without real money?**  
A: Yes! Use test keys and test cards (see Step 6.2)

---

## 🎉 You're Done!

Once all steps are complete, your company portal will:
- ✅ Accept Paystack payments
- ✅ Automatically update wallet balances
- ✅ Track all transactions in ledger
- ✅ Prevent duplicate processing
- ✅ Support both test and live modes

**Next Steps**:
1. Test thoroughly with test cards
2. Get KYC approved for live mode
3. Switch to live keys
4. Start accepting real payments! 💰

---

**Last Updated**: 2026-02-08  
**Version**: 1.0  
**Tested With**: Paystack API v1, Supabase Edge Functions
