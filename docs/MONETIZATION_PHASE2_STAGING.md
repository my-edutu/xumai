# Phase 2: safe identity, rules and database staging

**State:** Foundation code only. No XUM monetization, task rewards or withdrawals are enabled by this PR.

## Why this is separate from the main SQL bootstrap

The existing `supabase/00_schema.sql` models `public.users.id` as a UUID tied to `auth.users`; the deployed Expo app uses Clerk subject strings (`user_...`). Several pre-existing approval, revenue-sharing and withdrawal SQL functions mutate wallet balances. Executing the full bootstrap against an unverified production project would risk schema errors, duplicate payment obligations and account-ID collisions.

For that reason, Phase 2 introduces the **private** `xum_monetization` namespace without modifying `public.users`, the existing payment service, or `supabase/apply_all.sql`. There is no automatic migration deployment.

## Added contract

- `contributor_identity_links`: Clerk string subject, optional audited legacy UUID, pending/verified/blocked; the frontend cannot provision its own verified mapping.
- `program_controls`: disabled identity bridge, qualification, earnings and withdrawals, with constraints preventing financial activation out of order.
- `policy_versions`: typed, versioned eligibility thresholds; only a **draft** V1 proposal is seeded.
- `verified_evidence`: provenance-based evidence entries, not contributor self-attestation.
- `eligibility_decisions`: append-only, event-idempotent decisions with evidence digest and policy reference.
- `audit_events`: append-only, deduplicated audit events.
- `country_payment_rails`: disabled NGN bank rail with ₦5,000 configured as 500,000 minor units (kobo), not a live threshold on the existing wallet.
- `public.get_my_monetization_status_v1()`: authenticated, no-user-ID-parameter, read-only snapshot that returns **not_monetized / PROGRAM_DISABLED** until controls and identity are independently verified. It never authorizes a withdrawal.

The private schema revokes browser role table access even if PostgREST exposes it. `service_role` is trusted, server-side only. Never put a service-role key in Expo `EXPO_PUBLIC_*`, Vite `VITE_*`, or other frontend code.

## Staging test

GitHub Actions starts an isolated PostgreSQL 16 container, creates test Supabase-like roles and mock `auth.jwt()`, runs the new migration **twice**, and verifies security properties (role access, defaults, attestation requirement, immutable decisions, fail-closed user RPC).

Do not treat this isolated test as proof of production Clerk/Supabase compatibility. It tests the new *standalone* migration, not the existing complete XUM database.

## Deployment checklist — manual gate, do not skip

1. Identify the **actual deployed** XUM Supabase project and confirm its schema and authentication settings in read-only mode.
2. Back up a disposable staging clone (no live financial liabilities), configure Clerk native third-party auth in staging, and verify JWT issuer, role, and `sub` mapping.
3. Reconcile `public.users.id` and historical transaction identities. Match accounts by strong administrative/provider evidence, **never email alone**. Conflicts remain `pending`.
4. Inventory every direct balance write and older approval/sale/payout RPC; disable or safely replace bypass routes before allowing task rewards.
5. Review all RLS privileges, INCLUDING existing public users/tasks/transactions/withdrawals, as legacy `auth.uid() = user_id` cannot be presumed safe with Clerk `sub`.
6. Apply only the new migration in disposable staging, keep `program_controls` all false and payment rails disabled.
7. Run authenticated and anonymous RLS/API tests with **real signed Clerk test users**, then record test evidence and sign-offs.
8. Build verified evidence ingestion and signed webhook processing with signature verification, replay protection and stable idempotency keys. Keep evidence source as provider/API or qualified review, not self-supplied JSON.
9. Create gated admin APIs for effective-dated policy publishing and immutable audit logs (admin roles require independent validation). No client direct write access.
10. Only after identity and quality inputs work, connect the read-only API to a Monetization Center and implement the balanced ledger in a later phase.
11. Keep payouts OFF until qualified financial/security review, processor sandbox receipts, KYC controls, ledger reconciliation and human launch approval.

## Live compatibility risks still open

- **Existing follower-count qualification** (`xum_ai_app/src/services/monetizationThresholdService.ts`) must not become a monetization authorization.
- **Dataset resale vs task-approval rewards** and **batch payouts vs withdrawals** currently have overlapping balance mutations; do not turn on any new paid campaign until reconciled.
- This migration intentionally does **not** create a verified identity mapping from untrusted Clerk client data; it prepares restricted storage and status lookup only.
- Phase 2 does **not** claim to have fixed all old UUID RLS or payout flows; those are staged, separately reviewed work.

## Rollback / incident control

Before staging apply, snapshot the database. Do not `DROP SCHEMA CASCADE` in production as a convenience rollback; policy, identities and audit evidence require preservation. The default-off control state is the safe fallback. Create follow-on corrective migrations after review.
