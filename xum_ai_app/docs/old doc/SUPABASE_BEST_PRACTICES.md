# XUM AI Supabase Backend Best Practices

## Overview
This document outlines the best practices for using Supabase as the backend for XUM AI MVP, replacing the proposed Drizzle ORM approach with native Supabase patterns.

## Architecture Decision: Why Direct Supabase (Not Drizzle)

### Rationale
1. **Simplicity**: Supabase Client + TypeScript types generated from the database = zero-config type safety.
2. **Speed**: No ORM layer to maintain, configure, or debug.
3. **Supabase-Native Features**: Direct access to Row Level Security (RLS), Realtime, and Storage without abstraction layers.
4. **MVP Focus**: Faster iteration without managing migration files in two places (Drizzle + Supabase).

### When to Reconsider
- If you need complex, multi-database support.
- If you build a separate NestJS/Express backend that requires an ORM.

---

## 1. Type Safety (Replacing Manual Types)

### Current State
Types are manually defined in `src/types.ts` and duplicated in `src/services/taskService.ts`.

### Best Practice: Auto-Generate from Database
```bash
npm run generate-types
```

This runs:
```bash
npx supabase gen types typescript --project-id gkhemshbwmealgxczykk > src/types/supabase.ts
```

### Usage
```typescript
import { Database } from './types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type TaskSubmission = Database['public']['Tables']['task_submissions']['Insert'];
```

### Benefits
- **Zero drift**: Types are always in sync with the database schema.
- **IntelliSense**: Full autocomplete for table names, columns, and relationships.
- **Compile-time safety**: TypeScript will error if you reference a column that doesn't exist.

---

## 2. Row Level Security (RLS) - CRITICAL

### Golden Rule
**Every table MUST have RLS enabled.** The client should never be trusted.

### Example: User Submissions
```sql
-- Enable RLS
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own submissions
CREATE POLICY "Users can view own submissions"
ON task_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can create own submissions"
ON task_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Verification
Use the Supabase SQL Editor to run:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All critical tables should show `rowsecurity = true`.

---

## 3. Database Functions (RPCs) for Business Logic

### When to Use RPCs
- **Transactions**: Operations that need ACID guarantees (e.g., deducting balance + creating withdrawal).
- **Complex Queries**: Joins, aggregations, or conditional logic that's simpler in SQL.
- **Permissions**: When you need `SECURITY DEFINER` to bypass RLS for admin operations.

### Example: Current Usage
```typescript
// Frontend calls this:
const { data } = await supabase.rpc('get_user_balance', { p_user_id: userId });

// Backend SQL function:
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0) 
  FROM transactions 
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;
```

### Best Practices
1. **Prefix parameters**: Use `p_` to distinguish from column names.
2. **Mark as STABLE or IMMUTABLE**: Helps Postgres optimize.
3. **Use SECURITY INVOKER**: Unless you explicitly need to bypass RLS.

---

## 4. Supabase Storage Buckets

### Current Setup
Three buckets for task submissions:
- `voice-recordings`
- `image-captures`
- `video-recordings`

### Best Practices

#### Folder Structure
Organize by user:
```
voice-recordings/
  └── {user_id}/
      ├── 1707123456.m4a
      ├── 1707123789.webm
      └── ...
```

This allows for easy RLS on storage:
```sql
-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Public vs Private
- **Public**: If files need to be accessible without authentication (e.g., shared clips).
- **Private**: Default. Requires `Authorization` header to access.

#### Size Limits
Set maximum file upload size in Supabase Dashboard (Storage > Settings).

---

## 5. Edge Functions (When to Use)

### Use Cases
- **External API calls**: Integrations with payment processors, AI APIs, or third-party services.
- **Scheduled jobs**: Background tasks (via `pg_cron` or external cron).
- **Secret management**: Operations requiring API keys that shouldn't be in the client.

### Example: AI Chatbot
Currently implemented at `supabase/functions/ai-chat/index.ts` (if it exists).

### Best Practice
Keep Edge Functions **thin**. Most logic should be in Postgres Functions (RPCs) for:
- Faster execution (in-database).
- Easier testing (SQL is more testable than Deno).

---

## 6. Connection Pooling

### Current Setup
Using the Transaction Pooler:
```
DATABASE_URL=postgresql://postgres.gkhemshbwmealgxczykk:...@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```

### When to Use
- **Server-side only**: Edge Functions or a separate backend.
- **NOT for client-side**: The Supabase JS Client automatically uses the REST API (PostgREST), not a direct Postgres connection.

### Best Practice
For most MVP needs, the default Supabase JS client is sufficient. Only use pooler if you're deploying a Node.js backend.

---

## 7. Error Handling Patterns

### Consistent Error Checks
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

if (error) {
  console.error('[Service] Query failed:', error.message);
  // Return a safe fallback or throw
  return null;
}

return data;
```

### Never Expose Raw Errors to Users
```typescript
// ❌ BAD
alert(error.message);

// ✅ GOOD
const userFriendlyMessages = {
  '23505': 'This item already exists.',
  'PGRST116': 'Not found.',
};

const message = userFriendlyMessages[error.code] || 'An unexpected error occurred.';
alert(message);
```

---

## 8. Authentication Strategy

### Current State
Using both **Clerk** and **Supabase Auth** (legacy).

### Recommendation
**Migrate fully to Supabase Auth** for tighter integration:
- Single sign-on with RLS out of the box.
- No need to sync user IDs between systems.
- Magic links, OAuth, and phone auth built-in.

### Migration Path
1. Create users in Supabase Auth.
2. Update `profiles.user_id` to reference `auth.users.id`.
3. Remove Clerk dependencies.

---

## 9. Schema Design Best Practices

### Use UUID for Primary Keys
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  ...
);
```

### Timestamps
```sql
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()
```

Use Postgres triggers to auto-update `updated_at`:
```sql
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);
```

### Indexes
Add indexes on:
- Foreign keys (`user_id`)
- Columns used in `WHERE` clauses (`status`, `task_type`)
- Columns used in `ORDER BY` (`created_at DESC`)

```sql
CREATE INDEX idx_submissions_user_status 
ON task_submissions(user_id, status);
```

---

## 10. Testing & Verification

### Backend Health Check
```bash
npm run verify-backend
```

This script checks:
1. Credentials are configured.
2. Database is reachable.
3. Storage buckets exist.
4. RPC functions are callable.

### Manual Testing
1. **Create a test user** in Supabase Auth.
2. **Submit a task** via the app.
3. **Verify in Supabase Dashboard**:
   - Row appears in `task_submissions`.
   - File appears in Storage bucket.
   - Balance updates in `profiles` (if using triggers).

---

## 11. Development Workflow

### Proposed Workflow (Without Drizzle)
1. **Schema Changes**: Make changes in Supabase SQL Editor.
2. **Generate Types**: Run `npm run generate-types`.
3. **Update Frontend**: TypeScript will catch any breaking changes.
4. **Test**: Use `npm run verify-backend` to ensure everything works.

### Version Control
- **Do NOT commit** `.env` (it's gitignored).
- **Do commit** `src/types/supabase.ts` (it's generated but needed for CI/CD).

---

## 12. Monitoring & Performance

### Query Performance
Use `EXPLAIN ANALYZE` in the SQL Editor to find slow queries:
```sql
EXPLAIN ANALYZE
SELECT * FROM task_submissions 
WHERE user_id = 'some-uuid' 
ORDER BY created_at DESC;
```

### Logs
- **Dashboard**: Logs > Query Logs (shows slow queries).
- **Storage**: Monitor bandwidth usage in Storage > Usage.

---

## Summary: Key Takeaways

| Feature | Recommendation |
|---------|----------------|
| **Type Safety** | Auto-generate from Supabase (`npm run generate-types`) |
| **Business Logic** | Use Postgres Functions (RPCs) for transactions |
| **Security** | Enable RLS on all tables, never trust the client |
| **Storage** | Use user-scoped folders with RLS policies |
| **Auth** | Migrate to pure Supabase Auth (remove Clerk) |
| **Edge Functions** | Only for external APIs or secrets |
| **Drizzle** | **Not needed** for MVP—adds unnecessary complexity |

---

## Next Steps

1. ✅ Run `npm run verify-backend` to confirm setup.
2. ✅ Run `npm run generate-types` to create `src/types/supabase.ts`.
3. 🔄 Audit all tables to ensure RLS is enabled.
4. 🔄 Replace manual types in `src/types.ts` with generated types.
5. 🔄 Consider migrating from Clerk to Supabase Auth.
