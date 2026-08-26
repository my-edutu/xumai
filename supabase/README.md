# XUM AI database release procedure

`apply_all.sql` is the canonical ordered PostgreSQL bootstrap for a clean staging database. It is a `psql` script because it uses `\ir` to include each versioned SQL file; it is not intended to be pasted into the Supabase dashboard as one undifferentiated query. `schema.sql` and `task.sql` are retained snapshots/scratch files and are intentionally not included.

## Apply to staging

1. Confirm the target project and take a database backup.
2. Run `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/apply_all.sql` from the repository root.
3. Run the application backend verification command from `xum_ai_app`.
4. Run the RLS matrix with anonymous, contributor, company, and admin sessions before promoting.

The script must be run against a disposable staging project first. It is not evidence that the configured production project has the schema; the database connection and migration output must be retained with the release record.

## Release gates

- `ON_ERROR_STOP=1` must complete without warnings promoted to errors.
- Generated application types must match the applied schema.
- The withdrawal OTP RPC and `generate-prompts` Edge Function must be deployed before enabling those UI paths.
- The `request-withdrawal` Edge Function must be deployed with Resend secrets; the legacy direct withdrawal RPC is intentionally revoked for client roles.
- The `generate-prompts` Edge Function must be deployed with both `GEMINI_API_KEY` and an explicitly selected `GEMINI_MODEL` secret.
- Payment webhooks and payout workers must be exercised with provider test events, including duplicate delivery and failure retry cases.
