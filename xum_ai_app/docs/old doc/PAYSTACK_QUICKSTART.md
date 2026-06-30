# Paystack Quick Start Checklist

**Follow this checklist to get Paystack working in 15 minutes!**

---

## ✅ Step-by-Step Checklist

### 1. Get Paystack Keys (3 min)
- [ ] Go to https://dashboard.paystack.com
- [ ] Login or create account
- [ ] Navigate to Settings → API Keys & Webhooks
- [ ] Copy **Test Secret Key** (starts with `sk_test_`)
- [ ] Copy **Test Public Key** (starts with `pk_test_`)

---

### 2. Deploy Webhook Function (5 min)

Open terminal in project root:

```bash
cd "c:\Users\USER\Desktop\app projects\project 2025\xum ai"

# Login to Supabase
npx supabase login

# Link project
npx supabase link --project-ref gkhemshbwmealgxczykk

# Set secret key (replace with your actual key)
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_key_here

# Deploy webhook
npx supabase functions deploy paystack-webhook --project-ref gkhemshbwmealgxczykk
```

**Copy the function URL** from output (you'll need it next!)

---

### 3. Configure Webhook in Paystack (2 min)
- [ ] Go to https://dashboard.paystack.com/settings/developer
- [ ] Scroll to **Webhook URL**
- [ ] Click **Add Webhook URL**
- [ ] Paste: `https://gkhemshbwmealgxczykk.supabase.co/functions/v1/paystack-webhook`
- [ ] Click **Save**
- [ ] Verify green checkmark appears ✅

---

### 4. Update Company Portal (3 min)

#### 4a. Add Paystack SDK
Edit `company/index.html` - add before `</body>`:
```html
<script src="https://js.paystack.co/v1/inline.js"></script>
```

#### 4b. Set Environment Variable
Create/edit `company/.env.local`:
```bash
VITE_SUPABASE_URL=https://gkhemshbwmealgxczykk.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

Get `VITE_SUPABASE_ANON_KEY` from:
https://supabase.com/dashboard/project/gkhemshbwmealgxczykk/settings/api

#### 4c. Restart Dev Server
```bash
cd company
npm run dev
```

---

### 5. Test Payment (2 min)
- [ ] Open http://localhost:5173
- [ ] Login with company account
- [ ] Go to Billing page
- [ ] Click "Add Money"
- [ ] Enter amount (e.g., 1000)
- [ ] Select **Paystack**
- [ ] Click **Deposit**

#### Use Test Card:
```
Card: 4084 0840 8408 4081
CVV: 408
Expiry: 12/25
PIN: 0000
OTP: 123456
```

- [ ] Complete payment
- [ ] Check wallet balance increased ✅

---

## 🔍 Verify It Worked

### Check 1: Supabase Database
```sql
-- Check wallet
SELECT * FROM company_wallets;

-- Check ledger
SELECT * FROM financial_ledger ORDER BY created_at DESC LIMIT 5;

-- Check payment events
SELECT * FROM payment_events ORDER BY created_at DESC LIMIT 5;
```

### Check 2: Edge Function Logs
```bash
npx supabase functions logs paystack-webhook --project-ref gkhemshbwmealgxczykk
```

Look for: "Processing deposit" and "Deposit successful"

### Check 3: Paystack Dashboard
- [ ] Go to https://dashboard.paystack.com/transactions
- [ ] See your test transaction ✅

---

## ❌ Troubleshooting

### Error: "Paystack not initialized"
**Fix**: Add `<script src="https://js.paystack.co/v1/inline.js"></script>` to `company/index.html`

### Error: Webhook not receiving events
**Fix**: 
1. Check webhook URL in Paystack dashboard
2. Check function deployed: `npx supabase functions list`
3. Check logs: `npx supabase functions logs paystack-webhook`

### Error: Wallet not updating
**Fix**:
1. Check Edge Function logs for errors
2. Verify `PAYSTACK_SECRET_KEY` is set correctly
3. Check `company_wallets` table exists

---

## 📚 Full Documentation

For detailed instructions, see:
**`docs/PAYSTACK_IMPLEMENTATION_GUIDE.md`**

---

## 🎉 Success!

Once all checkboxes are ticked:
- ✅ Companies can deposit via Paystack
- ✅ Wallets update automatically
- ✅ Transactions logged in ledger
- ✅ Ready for live mode (after KYC)

**Time Required**: ~15 minutes  
**Difficulty**: Easy ⭐⭐☆☆☆  
**Support**: See full guide for detailed help

---

**Quick Commands Reference**:

```bash
# Deploy webhook
npx supabase functions deploy paystack-webhook --project-ref gkhemshbwmealgxczykk

# Set secret
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_...

# View logs
npx supabase functions logs paystack-webhook

# List functions
npx supabase functions list
```
