# XUM AI Supabase Backend - Quick Reference

## 🚀 Quick Start Commands

### Verify Backend Health
```bash
npm run verify-backend
```
Checks:
- ✅ Supabase credentials configured
- ✅ Database connection working
- ✅ Storage buckets exist
- ✅ RPC functions callable

### Generate TypeScript Types
```bash
npm run generate-types
```
Creates `src/types/supabase.ts` with full type safety from your database schema.

---

## 📁 Project Structure

```
XUM AI/
├── src/
│   ├── supabaseClient.ts          # Supabase initialization
│   ├── types.ts                   # Manual types (to be migrated)
│   ├── types/
│   │   └── supabase.ts           # Auto-generated types (✨ NEW)
│   └── services/
│       └── taskService.ts        # Main backend service layer
├── scripts/
│   └── verify-supabase-config.ts # Health check script (✨ NEW)
├── docs/
│   ├── SUPABASE_BEST_PRACTICES.md    # Comprehensive guide (✨ NEW)
│   └── IMPLEMENTATION_SUMMARY.md     # Implementation details (✨ NEW)
└── .env                          # Environment variables
```

---

## 🔐 Environment Variables

Required in `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://gkhemshbwmealgxczykk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Project ID**: `gkhemshbwmealgxczykk` (extracted from URL)

---

## 📊 Current Database Tables (Inferred from Code)

| Table | Purpose | RLS Status |
|-------|---------|------------|
| `profiles` | User profiles and balances | ⚠️ Verify |
| `capture_prompts` | Task prompts (voice/image/video) | ⚠️ Verify |
| `task_submissions` | User task submissions | ⚠️ Verify |
| `user_activities` | Activity log | ⚠️ Verify |
| `transactions` | Earnings and withdrawals | ⚠️ Verify |
| `featured_tasks` | Homepage featured cards | ⚠️ Verify |
| `admin_tasks` | Daily missions & XUM Judge | ⚠️ Verify |
| `user_leaderboard` | Global leaderboard (view?) | ⚠️ Verify |

**⚠️ Action Required**: Verify RLS is enabled on all tables.

---

## 🪣 Storage Buckets

| Bucket | File Types | Folder Structure |
|--------|-----------|------------------|
| `voice-recordings` | `.m4a`, `.webm`, `.mp3` | `{user_id}/{timestamp}.ext` |
| `image-captures` | `.jpg`, `.png`, `.webp` | `{user_id}/{timestamp}.ext` |
| `video-recordings` | `.mp4`, `.webm` | `{user_id}/{timestamp}.ext` |

**RLS Policy Needed**:
```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🔧 Database Functions (RPCs)

Currently used in `taskService.ts`:

| Function | Purpose | Parameters |
|----------|---------|------------|
| `get_random_prompts` | Fetch random task prompts | `p_task_type`, `p_user_id`, `p_count` |
| `log_user_activity` | Log user actions | `p_user_id`, `p_activity_type`, `p_description`, etc. |
| `get_user_earnings` | Calculate total earnings | `p_user_id` |
| `get_daily_missions` | Fetch missions with unlock status | `p_user_id` |
| `get_xum_judge_tasks` | Fetch XUM Judge tasks | `p_user_id` |
| `get_transaction_history` | User transaction log | `p_user_id`, `p_limit`, `p_offset` |
| `get_user_balance` | Current balance | `p_user_id` |
| `request_withdrawal` | Create withdrawal request | `p_user_id`, `p_amount`, `p_payment_method`, etc. |

---

## 🎯 Type Safety Usage

### Before (Manual Types)
```typescript
import { TaskSubmission } from '../types';

const submission: TaskSubmission = { ... };
```

### After (Generated Types) ✨
```typescript
import { Database } from '../types/supabase';

type TaskSubmission = Database['public']['Tables']['task_submissions']['Insert'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const submission: TaskSubmission = { ... };
```

**Benefits**:
- ✅ Auto-updated when schema changes
- ✅ Full IntelliSense support
- ✅ Compile-time type checking

---

## 🛡️ Security Checklist

- [ ] **RLS Enabled**: All tables have `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`
- [ ] **User Policies**: Users can only access their own data
- [ ] **Storage Policies**: Users can only upload/read from their folder
- [ ] **Function Security**: RPCs use `SECURITY INVOKER` (unless admin)
- [ ] **Anon Key**: Only exposed in frontend (never service role key)
- [ ] **Secrets**: API keys stored in Edge Function environment (not client)

---

## 🔍 Common Queries

### Check RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### List Storage Buckets
```sql
SELECT * FROM storage.buckets;
```

### View User Balance
```sql
SELECT get_user_balance('user-uuid-here');
```

---

## 🐛 Troubleshooting

### "Missing or invalid credentials"
- Check `.env` file exists and has correct values
- Restart dev server (`npx expo start`)

### "Row Level Security policy violation"
- Ensure RLS policies exist for the operation
- Check if `auth.uid()` matches the `user_id` in the policy

### "Storage bucket not found"
- Run `npm run verify-backend` to check bucket status
- Create missing buckets in Supabase Dashboard > Storage

### "Function does not exist"
- Check function name spelling
- Verify function is deployed in Supabase Dashboard > SQL Editor

---

## 📚 Resources

- **Supabase Dashboard**: [https://supabase.com/dashboard/project/gkhemshbwmealgxczykk](https://supabase.com/dashboard/project/gkhemshbwmealgxczykk)
- **Docs**: `docs/SUPABASE_BEST_PRACTICES.md`
- **Implementation Summary**: `docs/IMPLEMENTATION_SUMMARY.md`
- **Verification Script**: `scripts/verify-supabase-config.ts`

---

## ✅ Next Actions

1. **Run Verification**:
   ```bash
   npm run verify-backend
   ```

2. **Generate Types** (if not automatic):
   ```bash
   npm run generate-types
   ```

3. **Review RLS Policies**:
   - Go to Supabase Dashboard
   - Check each table under "Authentication > Policies"

4. **Migrate to Generated Types**:
   - Update imports in `src/services/taskService.ts`
   - Replace manual interfaces with `Database` types

---

**Last Updated**: 2026-02-08  
**Supabase Project**: gkhemshbwmealgxczykk (XUM AI)
