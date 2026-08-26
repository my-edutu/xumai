# XUM AI Production Completion Roadmap

> Status baseline: 2026-08-26. This roadmap describes the work required to take the contributor app, company portal, admin tools, and backend from prototype/partially verified state to a production-ready release.

## Product target

XUM AI lets contributors complete voice, image, video, lexicon, validation, and RLHF tasks for rewards; lets companies create campaigns and purchase/export trusted datasets; and lets administrators moderate work, manage payouts, and operate the platform.

## Current verified state

- The Vercel-configured Expo/Metro build (`npm run build:web`) completes when Metro worker spawning is permitted.
- The generated Expo web bundle renders the onboarding screen locally.
- The separate Vite build remains an optional local path; its runtime is not the deployment contract and still requires a separate Expo-runtime compatibility fix. Production uses the Expo/Metro export.
- The client TypeScript gate (`npx tsc --noEmit`) and unit gate now pass; Supabase Edge Functions remain a separate runtime check.
- Existing documentation claims many screens are complete, but the source still contains backend-required validation/marketplace paths and server-owned quality/payout dependencies. Withdrawal OTP now fails closed until its server RPC is deployed.
- Supabase SQL is spread across ordered files and must be applied and verified against the live project before feature claims are accepted.

## Stack and deployment contract

| Layer | Current choice | Completion decision |
|---|---|---|
| Contributor UI | Expo SDK 54, React Native, React Native Web | Keep; make web-safe with platform-specific adapters where needed |
| Web bundling | Expo/Metro for Vercel; Vite as a second local path | Make Expo/Metro the canonical deploy path; either repair Vite or remove its misleading production claim |
| Auth | Clerk Expo | Keep Clerk as identity provider and synchronize verified users to Supabase |
| Data | Supabase Postgres, Storage, Realtime, Edge Functions | Keep; consolidate migrations and regenerate typed schema |
| Payments | Existing withdrawal RPCs plus provider integration gap | Complete through a server-side payment adapter and verified webhooks |
| Hosting | Vercel static web output, EAS native builds | Deploy only after web and native release gates pass |
| Observability | Sentry shim on web and Sentry native package | Add web error reporting and preserve actionable release metadata |

## Complete data model

Existing entities to verify and type: `users`, `profiles`, `submissions`, `submission_metadata`, `submission_validations`, `validation_votes`, `duplicate_hashes`, `lexicon_concepts`, `lexicon_submissions`, `rlhf_tasks`, `rlhf_submissions`, `safety_review_queue`, `safety_scores`, `cultural_review_queue`, `cultural_scores`, `datasets`, `dataset_items`, `marketplace_datasets`, `dataset_purchases`, `capture_prompts`, `company_campaigns`, `transactions`, `withdrawals`, `user_payment_methods`, `referrals`, `notifications`, `notification_topics`, `user_notification_preferences`, `push_tokens`, `api_keys`, `api_key_scopes`, `api_logs`, `admin_sessions`, `audit_logs`, and `fraud_flags`.

Required relationships and invariants:

- A contributor owns submissions, payment methods, referrals, transactions, notification preferences, and purchases.
- A task or campaign produces submissions; submissions may have metadata, pre-check flags, validator votes, quality scores, and a final status.
- A dataset contains approved dataset items sourced from submissions; a marketplace listing references one dataset; a purchase grants access through a signed export or download.
- A company owns campaigns, API keys, and dataset purchases; company roles control campaign, team, billing, and API access.
- Every reward, withdrawal, purchase, and fee is represented by an idempotent transaction or ledger record.
- Service-role operations run only in Edge Functions; browser clients receive only publishable Clerk/Supabase values and user-scoped data allowed by RLS.

## Phases

### Phase 0 — Release foundation and web startup

Goal: Every supported build starts, renders, and reports errors predictably.

Tasks:

- Fix `src/config/fonts.ts` for web-safe font loading and retain native font loading.
- Decide the web contract: Vercel uses `npm run build:web`; make `npm run dev:web`/`npm run preview:web` exercise the same Expo output. Repair Vite only if it remains an intentional supported path.
- Add a web smoke test that loads onboarding, advances to auth, opens sign-up, and asserts no uncaught exception or blank root.
- Add guarded adapters for `expo-notifications`, `expo-camera`, `expo-av`, `expo-media-library`, `expo-secure-store`, and native-only file APIs when `Platform.OS === 'web'`.
- Fix missing web CSS/asset paths, responsive root sizing, keyboard/focus behavior, and error-boundary visibility.
- Make environment validation fail clearly at build/deploy time without exposing secret values.

Definition of done: `npm run build:web`, the canonical preview, and the web smoke journey pass on desktop and mobile viewport sizes; no blank page, uncaught startup exception, or missing critical asset remains.

### Phase 1 — Type safety, test harness, and source-of-truth cleanup

Goal: The repository has reliable gates and one accurate feature status document.

Tasks:

- Replace the JavaScript React Native shim with a typed web adapter or configure platform declarations so `npx tsc --noEmit` checks application code correctly.
- Resolve actual type errors in `TaskPrompt`, `Task`, `ThemeId`, style tokens, video permission handling, and `TaskScreens` theme usage.
- Exclude Supabase Deno functions from the client TypeScript project and add a separate Deno check for them.
- Add unit tests for wallet, user, referral, validation, quality, dataset, and campaign services with Supabase mocked at the service boundary.
- Add a stable test seed/reset strategy for Supabase staging and a browser smoke suite for contributor, company, and admin entry points.
- Reconcile `task.md`, `docs/features.md`, `post_launch_roadmap.md`, and the code; status must say “implemented,” “backend-required,” or “not implemented” based on executable evidence.

Definition of done: typecheck is clean for client and functions, unit tests pass, smoke tests run from a clean checkout, and status docs no longer contradict the source.

### Phase 2 — Supabase baseline, RLS, and server-side secrets

Goal: The live backend is reproducible, secure, and ready for real data.

Tasks:

- Combine the existing SQL into a versioned migration sequence and apply, in order, core, feature 2, feature 3, RPC, gap, referral, company campaign, payment method, and API-key migrations to staging.
- Run `npm run generate-types` and update service interfaces from the generated schema.
- Verify every RLS policy with anonymous, authenticated contributor, company, and admin sessions; remove public reads from `api_keys`, `api_key_scopes`, and sensitive logs.
- Replace direct secret comparison in `supabase/functions/_shared/auth.ts` with a one-way hash verification strategy and constant-time comparison; log only key ID and request metadata.
- Move Gemini and Resend calls behind authenticated Edge Functions; remove `GEMINI_API_KEY`, Resend secrets, database URLs, service-role keys, and any other private value from client bundles.
- Add rate limits, idempotency keys, audit events, and request correlation IDs to server-side mutations.

Definition of done: staging migrations are applied from a clean database, generated types match the schema, RLS tests pass, secret scanning finds no private key in web assets, and Edge Functions pass authenticated/unauthenticated tests.

### Phase 3 — Contributor task engine and quality pipeline

Goal: Contributors receive real eligible work, submit it, and receive deterministic quality and reward outcomes.

Tasks:

- Replace hardcoded A/B tasks in `ValidationTaskScreen` with a DB-backed validation queue and an atomic “claim next task” RPC.
- Complete `prompt_text` and metadata persistence for every submission type.
- Implement real consensus aggregation with minimum votes, tie handling, validator exclusion, duplicate-vote protection, and idempotent reward crediting.
- Implement quality analysis server-side: audio duration/format plus SNR/noise estimate; image blur, dimensions, and policy/NSFW result; video duration, codec, frame/sample quality, and policy result.
- Store quality results and flags in normalized columns/JSON with versioned analyzer metadata; never silently treat a failed analyzer as a passing score.
- Add gold-standard tasks, validator accuracy, inter-rater agreement, calibration history, and a configurable unlock rule combining volume, accuracy, and quality.
- Finish Safety Scoring and Cultural Appropriateness queues with real task assignment, submissions, review results, rewards, and admin moderation.
- Add loading, retry, duplicate-submit protection, offline/error messaging, and success confirmation to every contributor submission button.

Definition of done: a seeded contributor can complete each task type from queue to approved/rejected status, quality flags are persisted, consensus and rewards are reproducible, and unlock eligibility changes only from server-verified metrics.

### Phase 4 — Company campaigns, team access, and dataset marketplace

Goal: A company can create a campaign, receive reviewed data, and purchase/export a licensed dataset.

Tasks:

- Replace the company marketplace maintenance state with real marketplace dataset listing, filtering, pricing, licensing, and availability data.
- Complete team invitations, role assignment, membership revocation, and permission checks for owner, manager, reviewer, and billing roles.
- Harden `CampaignWizard` validation, draft/edit flow, budget limits, approval state, pause/resume, and contributor feed publication.
- Connect campaign progress and insights to real submissions, quality, consensus, cost, and completion metrics.
- Implement purchase idempotency, wallet/provider payment authorization, receipt/ledger records, signed dataset download URLs, expiration, and access revocation.
- Add dataset versioning, export manifest, provenance, license text, and a company purchase history.

Definition of done: a test company can invite a member, create/approve a campaign, receive a contributor submission, see verified metrics, purchase a dataset once, download it through an expiring authorized URL, and see a complete audit trail.

### Phase 5 — Wallet, payouts, and financial controls

Goal: Contributors can safely add a payout method, request a payout, verify it, and see final settlement.

Tasks:

- Validate and encrypt/limit access to bank, mobile-money, PayPal, and USDT destination data; add country/currency/network rules.
- Replace the simulated `123456` OTP and “any six digits” acceptance with a server-generated one-time challenge delivered by a configured provider, expiration, retry limits, and lockout.
- Implement provider adapter, webhook signature verification, payout idempotency, settlement/reconciliation, failure/retry states, and admin approval controls.
- Add fee calculation, currency conversion policy, ledger entries, user-visible fee breakdown, and accounting export.
- Add a web-safe payment UX and a separate iOS IAP path for digital credit funding if credit purchases are part of the launch scope.

Definition of done: test-mode money can move through authorization, OTP, admin review, provider webhook, settlement/failure, and reconciliation without balance duplication or negative balances.

### Phase 6 — Admin operations, notifications, and trust/safety

Goal: Operations staff can run the platform with real data and users receive reliable updates.

Tasks:

- Replace remaining admin mock metrics, sessions, audit logs, fraud flags, task governance, and lexicon orchestration data with protected queries/RPCs.
- Enforce admin role claims server-side for every admin mutation; record actor, target, before/after, reason, and correlation ID.
- Add fraud rules for duplicate media, multi-account behavior, payout anomalies, validator collusion, and suspicious API use; include review/appeal states.
- Finish notification preferences, topic subscriptions, interactive task actions, background handling, custom sounds, Android channels, and deep-link routing on native.
- Provide browser-compatible in-app notifications and graceful no-permission behavior; do not request native push APIs on web.
- Add data retention, account deletion, export, privacy/consent, and abuse-report workflows.

Definition of done: an admin can moderate a submission, payout, fraud flag, campaign, and API key with an audit record; notification actions route correctly on supported platforms; privacy operations complete without orphaned user data.

### Phase 7 — Launch hardening and release

Goal: The product is deployable, observable, documented, and supportable.

Tasks:

- Run full contributor, company, and admin end-to-end journeys against staging with seeded data and test providers.
- Run accessibility checks for keyboard navigation, labels, focus order, color contrast, reduced motion, and mobile viewport behavior.
- Run bundle/performance checks, remove dead duplicate app paths, split oversized web chunks where valuable, and verify CDN caching/security headers.
- Configure Vercel environment variables, Clerk allowed origins, Supabase redirect URLs, Edge Function secrets, Sentry release/source maps, and EAS production credentials.
- Deploy staging, execute smoke tests against the deployed URL, then deploy production with rollback instructions.
- Publish operator runbooks for migrations, payout reconciliation, moderation, incident response, key rotation, and support escalation.

Definition of done: staging and production pass the same smoke suite, monitoring receives a deliberate test event, rollback is documented, and the release checklist is signed for web, Android, and iOS scope.

## Build order and priority

| Priority | Phase | Why it comes here |
|---|---|---|
| P0 | 0 | The web entrypoint must be usable before feature testing has value |
| P0 | 1–2 | Tests, types, schema, RLS, and secrets prevent false “working” states |
| P1 | 3 | This is the contributor value loop and source of platform data |
| P1 | 4–5 | Companies and payouts are the revenue and trust-critical paths |
| P1 | 6 | Operations and notifications are required for safe scale |
| P0 | 7 | No public launch before deployed end-to-end verification |

## Deliberately deferred unless launch scope requires them

- Full offline-first capture and conflict resolution.
- Exact Android alarms and sophisticated background prefetching.
- A broad third-party integrations ecosystem beyond the documented API/webhooks.
- Advanced AI pre-moderation beyond the quality analyzers required for acceptance.
- Multi-region data residency and enterprise SSO until a customer contract requires them.

These are not reasons to call the current release complete; they are boundaries for avoiding uncontrolled scope expansion after the core product is reliable.
