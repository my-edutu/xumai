# XUM Monetization — verified decisions and admin API rollout

## State of this change

This PR adds **staging-only** PostgreSQL APIs and an evidence-backed qualification evaluator. It does **not** deploy to XUM's Supabase project, set up the actual Clerk/qualification providers, activate monetization, enable payouts, or reconcile legacy wallet functions.

The database isolation suite creates temporary PostgreSQL 16 instances and tests the source-level contract with **mock signed-claim equivalents**. These tests are not proof that Clerk JWT verification, row-level security, or the existing wallet behave safely in the production Supabase deployment.

## Deployed APIs when migrations are applied safely

| API | Authentication | Operation | Financial permission |
| --- | --- | --- | --- |
| `public.get_my_monetization_status_v1()` | Supabase-verified Clerk user JWT | Read only, own contributor ID inferred from JWT | Never |
| `public.admin_monetization_policy_overview_v1()` | Signed Clerk JWT **and** database `policy_read` grant | Read versioned thresholds and program flags | Never |
| `public.admin_recent_eligibility_decisions_v1(limit)` | Signed Clerk JWT + `eligibility_review` grant | Read recent pseudonymous decisions, limited to 50 | Never |
| `public.admin_propose_monetization_policy_v1(jsonb, event_key)` | Signed Clerk JWT + `policy_draft` grant | Create immutable **draft** policy and audit event | Never |
| `public.admin_publish_monetization_policy_v1(draft_id, event_key, effective_at)` | Signed Clerk JWT + `policy_publish` grant from a **different reviewer** | Create immutable published copy and audit event | Never |
| `xum_monetization.assess_contributor_v1(link_id, policy_id, event_key)` | Trusted backend `service_role` only, private schema | Calculate and record an immutable, evidence-based eligibility decision | Never |

The existing Phase 2 `program_controls` constraint explicitly prevents `earnings_enabled` and `withdrawals_enabled` from ever becoming true. Published policies cannot bypass that guard.

## Evidence pipeline contract

All evidence originates in `xum_monetization.verified_evidence`; only the **trusted backend service role** may write there. The evaluator accepts these source types:
- `clerk_verified` for verified email/phone/age where the identity provider can actually prove it; a typed phone number is not proof;
- `academy_verified` for completed training;
- `qualification_scoring` for gold-test attempts/accuracy;
- `quality_review` for validated approved submissions;
- `fraud_review` for unresolved serious violations/duplicate/fraud counts (including explicit verified zero);
- `consent_ledger` for accepted terms and dataset-license versions;
- `admin_attestation` for separately verified evidence with audit/reference (restricted to back-office providers; never from browser input).

Supported signal keys:
`residence_country`, `account_active`, `verified_age_years`, `age_evidence_verified`,
`email_verified`, `phone_verified`, `profile_completeness_percent`,
`academy_completed`, `graded_qualification_tasks`,
`qualification_accuracy_percent`, `approved_contributions`,
`accepted_terms_version`, `accepted_dataset_license_version`,
`unresolved_serious_policy_violations`, `unresolved_duplicate_flags`,
`unresolved_high_risk_fraud_flags`.

**This migration only supplies storage and the evaluator; it does not invent actual qualification records, auto-import unverified `public.users` values, or install signed Clerk webhook handlers.** Producers must be implemented/connected and reviewed separately. The evaluator fails closed if evidence is missing, expired, stale, malformed, country-mismatched, or from an unapproved source.

No client may send arbitrary `identity_link_id`, assessment scores, grade results or payment status to the service role. The stable Clerk subject must be obtained from a verified provider JWT or signed provider webhook and mapped by strongly corroborated evidence to any legacy UUID.

## Rollout order

1. Confirm XUM Supabase project ref and ownership. Compare its actual schema and RLS to committed SQL without running any write operation.
2. Review and back up staging; test previous `202610130001_monetization_phase2_foundation.sql` migration on a disposable database first.
3. Configure Supabase to verify JWTs issued by the actual Clerk instance. Test role, subject, issuer, audience and an unauthorized user on staging.
4. Apply `202610130002_monetization_verified_admin_apis.sql` on the same verified staging clone, twice for idempotence.
5. Provision admin grants **only from the trusted service role** after independent staff identity approval. Never grant to arbitrary emails or public Clerk metadata. The deployed admin app obtains a token using Clerk `useAuth().getToken()` and the dedicated client.
6. Create verified contributor identity links using a strongly corroborated legacy UUID ↔ Clerk mapping. Do **not** join by email alone. Any ambiguous link stays blocked/pending.
7. Install trusted evidence ingestion producers with authenticated service-to-service credentials, source-event idempotency, tamper-resistant log references, and explicit provenance. Keep the service role key in server secrets only.
8. Enable **identity bridge** and **qualification** controls in **staging only** after RLS/claim verification. Existing SQL check constraints continue to prohibit both earnings and withdrawals.
9. With two independently approved operators, propose then publish a reviewed policy version; confirm country-specific qualification and event-replay tests.
10. Run regression for status expiry after 24 hours, new fraud evidence invalidation, JWT expiry, no-cross-user lookup, revoked admin grants, duplicate events, and frontend behavior when the backend is unavailable.
11. Review duplicate legacy financial paths, create the balanced ledger/payout service and independently approve a later migration before considering real money.

## API authorization pitfalls

- **Never** rely on `AdminContext.isAdmin`, a hard-coded admin email list, or Clerk `publicMetadata` alone for server writes. The new SQL requires explicit, scoped `administrator_grants` rows.
- An admin grant must have a subject, scope, grantor, rationale, expiry where appropriate, and revocation path. Published policies cannot be edited; creating a new policy is required.
- Do not expose any service-role key in Expo `EXPO_PUBLIC_*`, Vite `VITE_*`, Netlify public environments, or mobile app builds.
- The admin React form currently shows **read-only** snapshots. Its service adapter supports draft/propose/publish, but the UI deliberately does not expose those buttons before operator provisioning and production authorization review.
- New evidence invalidates prior decisions, including recently recorded eligible decisions. Historical ledger/wallet payouts are not handled or deactivated by this feature.
- The contributor center only shows a verified checklist when the trusted backend returns it. No simulated progress, balance, or withdrawal promise.

## Production release blockers

Until the correct Supabase project and real signed identity providers are verified, the backend status is **unavailable** and rules in the admin interface remain *proposed*. Existing payout and balance mutation RPCs remain outside the scope of this work and must be inventoried and remediated separately. No monetary claims or automatic withdrawal processing should be launched using this change alone.
