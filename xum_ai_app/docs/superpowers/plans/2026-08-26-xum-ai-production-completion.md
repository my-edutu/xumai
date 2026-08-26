# XUM AI Production Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the XUM AI contributor web app, company flows, admin operations, and backend safe and verifiably production-ready.

**Architecture:** Keep Expo/React Native Web as the shared UI and Supabase as the data, storage, realtime, and server-function layer. Use platform-specific adapters for native-only APIs, keep all private provider operations in Edge Functions, and make the Expo/Metro `dist-web` output the single Vercel deployment contract.

**Tech Stack:** Expo SDK 54, React Native Web, TypeScript, Clerk, Supabase Postgres/Storage/Realtime/Edge Functions, Vercel, EAS, Sentry.

**Spec:** `docs/ROADMAP.md`

## Global Constraints

- Preserve Android and iOS behavior while repairing web behavior.
- Use `src/supabaseClient.ts` for browser Supabase access and RLS-scoped queries.
- Never ship service-role keys, provider secrets, `DATABASE_URL`, raw API secrets, or private payment credentials to the browser.
- Keep named service exports, explicit TypeScript interfaces, async `try/catch`, and standardized `{ success, error }` results.
- Apply SQL migrations before claiming a backend feature works; regenerate `src/types/supabase.ts` after schema changes.
- A feature is complete only after a success path, failure path, retry path, and authorization path are tested.

## File map

| Area | Existing files | Planned responsibility |
|---|---|---|
| Web bootstrap | `index.tsx`, `vite.config.ts`, `web-shell.css`, `src/config/fonts.ts` | One canonical web build, font/assets, startup error handling |
| Platform adapters | `react-native-web-shim.js`, `src/services/mediaCapture.ts`, `src/services/notificationService.ts` | Safe web fallbacks and typed native capability boundaries |
| Auth/session | `src/context/ClerkProvider.tsx`, `src/App.tsx`, `src/screens/AuthScreensNative.tsx` | Clerk lifecycle, Supabase JWT sync, onboarding redirects |
| Contributor workflow | `src/screens/TaskMarketplaceScreen.tsx`, `src/screens/tasks/*`, `src/services/taskService.ts`, `validationService.ts`, `qualityService.ts` | Real queue, capture, validation, quality, consensus, rewards |
| Company/marketplace | `src/screens/CompanyDashboardScreen.tsx`, `DatasetSalesScreen.tsx`, `CampaignWizard.tsx`, `campaignService.ts`, `datasetService.ts` | Campaigns, team roles, purchases, exports |
| Financial | `WalletScreen.tsx`, `PaymentMethodsScreen.tsx`, `walletService.ts`, `userService.ts` | Secure methods, OTP, provider settlement, fees |
| Admin | `src/screens/AdminScreens.tsx`, `apiKeyService.ts`, `supabase/functions/*` | Real operations, RBAC, API auth, audit/fraud |
| Database | `docs/sql/*.sql`, `supabase/functions`, `src/types/supabase.ts` | Versioned migrations, RPCs, Edge Functions, generated types |
| Verification | New `tests/unit/*`, `tests/e2e/*`, test config | Service and browser regression gates |

### Task 1: Establish the canonical web release path

**Files:**
- Modify: `package.json`, `vercel.json`, `docs/ROADMAP.md`
- Test: `dist-web/index.html` and deployed preview URL

- [ ] Confirm Vercel uses `npm run build:web` and `dist-web`; add `dev:web` and `preview:web` scripts that exercise the same Expo/Metro output.
- [ ] Remove or repair the Vite path so `npm run build` cannot be mistaken for the deployed web artifact.
- [ ] Add a release check that verifies `dist-web/index.html`, the Expo JS bundle, fonts, manifest, and icons exist before deployment.
- [ ] Run `npm run build:web` and serve `dist-web`; verify the onboarding screen renders at desktop and mobile viewport sizes.

### Task 2: Repair web-safe font and native-module boundaries

**Files:**
- Modify: `src/config/fonts.ts`, `react-native-web-shim.js`, `src/services/mediaCapture.ts`, `src/services/notificationService.ts`
- Add: `src/types/assets.d.ts` if static font imports require declarations
- Test: web startup smoke test and native TypeScript check

- [ ] Replace browser-executed `require()` font loading with a web-safe font map while retaining native asset loading.
- [ ] Guard notification, camera, audio, media-library, secure-store, and file APIs so web either uses a supported browser API or returns a typed unavailable result.
- [ ] Render a visible configuration/error state when Clerk or Supabase configuration is missing; never leave an empty root.
- [ ] Build both `npm run build:web` and the supported local web command, then inspect the generated JS for unresolved font asset calls.

### Task 3: Make typecheck and tests meaningful

**Files:**
- Modify: `tsconfig.json`, `react-native-web-shim.js`, `src/services/types.ts`, `src/types.ts`, `src/store/useAppStore.ts`, `src/components/primitives/Input.tsx`, `src/screens/TaskScreens.tsx`
- Add: `tests/unit/*`, `vitest.config.ts` or the selected test configuration
- Test: `npx tsc --noEmit`, unit test command

- [ ] Separate client TypeScript from Deno Edge Function checking; add the correct platform declarations instead of hiding application errors.
- [ ] Define one `Task`, `TaskPrompt`, `ThemeId`, and token/style type used by services and screens.
- [ ] Fix all strict errors, including implicit callback parameters, missing theme scope, nullable permissions, and incorrect service exports.
- [ ] Add deterministic unit coverage for wallet, user, referral, validation, quality, dataset, and campaign service outcomes.
- [ ] Require typecheck and unit tests in the release command.

### Task 4: Consolidate and verify Supabase migrations

**Files:**
- Modify: `docs/sql/migrations.sql`, `feature2_migration.sql`, `feature3_migration.sql`, `rpc_functions.sql`, `gap_migrations.sql`, `referral_system_migration.sql`, `company_campaigns_migration.sql`, `api_keys_migration.sql`, `user_payment_methods_migration.sql`
- Modify: `src/types/supabase.ts`
- Test: staging database migration and RLS test script

- [ ] Create a numbered migration order covering core tables, submissions, validation, datasets, safety/cultural review, referrals, campaigns, payments, and API keys.
- [ ] Apply the order to a clean staging project and rerun it against the existing project with idempotent checks.
- [ ] Generate types from the live schema and update services to use the generated names and nullability.
- [ ] Test anonymous, contributor, company, and admin reads/writes against every sensitive table.
- [ ] Document the exact migration command and rollback procedure.

### Task 5: Close the security and secret-exposure gaps

**Files:**
- Modify: `vite.config.ts`, `src/services/apiKeyService.ts`, `supabase/functions/_shared/auth.ts`, `docs/sql/api_keys_migration.sql`
- Add/modify: authenticated Edge Functions for Gemini, Resend, exports, and API access
- Test: built-asset secret scan and Edge Function authorization tests

- [ ] Remove `GEMINI_API_KEY` and all private provider values from Vite/Metro client defines; expose only the public Clerk key and Supabase anon key.
- [ ] Change `api_keys` RLS so browser users cannot read secret hashes or other tenants’ keys.
- [ ] Hash API secrets server-side, verify them without direct plaintext comparison, enforce scopes/rate limits, and record key ID only in logs.
- [ ] Require authenticated ownership checks for key creation/revocation and company data access.
- [ ] Scan `dist-web` and `dist` for private key patterns before every deploy.

### Task 6: Replace mock validation with a real queue and consensus

**Files:**
- Modify: `src/screens/tasks/ValidationTaskScreen.tsx`, `src/services/validationService.ts`, `src/services/taskService.ts`
- Add: migration/RPC for validation queue claims and gold tasks
- Test: queue claim, duplicate vote, tie, rejection, consensus, and reward tests

- [ ] Add a DB-backed A/B task table or source existing validation records through a single atomic claim RPC.
- [ ] Remove hardcoded task objects and request the next eligible task using the authenticated user ID.
- [ ] Enforce one vote per validator per submission, prevent self-validation, expire abandoned claims, and make vote submission idempotent.
- [ ] Calculate consensus and validator reward only after the configured minimum vote count and persist the decision atomically.
- [ ] Add empty, loading, retry, and completed-session states.

### Task 7: Implement quality scoring and judge eligibility

**Files:**
- Modify: `src/services/qualityService.ts`, `src/services/preCheckService.ts`, `src/services/monetizationThresholdService.ts`, `src/screens/XumJudgeScreen.tsx`
- Add: quality analyzer Edge Function, quality columns/migration, gold calibration tables/RPCs
- Test: audio, image, video, analyzer failure, calibration, unlock, and reward tests

- [ ] Replace simulated SNR/clarity and placeholder blur/NSFW results with server-side analyzers that return version, score, flags, and failure state.
- [ ] Persist analyzer results before moderation and require explicit handling for analyzer failures.
- [ ] Add gold-standard assignments, accuracy, agreement, and quality thresholds to unlock logic.
- [ ] Make thresholds configurable by admin but evaluated in a server-side RPC.
- [ ] Show contributors why a judge task is locked and how progress is calculated.

### Task 8: Finish all contributor task types and metadata

**Files:**
- Modify: `src/screens/tasks/LexiconTaskScreen.tsx`, `RLHFCorrectionScreen.tsx`, `SafetyScoringScreen.tsx`, `CulturalAppropriatenessScreen.tsx`, `SubmissionValidationScreen.tsx`, `src/screens/TaskScreens.tsx`
- Modify: `src/services/taskService.ts`, `validationService.ts`, `datasetService.ts`
- Test: one full submit/review path per task type

- [ ] Persist `prompt_text`, task/campaign IDs, capture metadata, language, consent, and quality result references for every submission.
- [ ] Ensure safety and cultural tasks use real queues and reward RPCs instead of only presentational screens.
- [ ] Add loading overlays, retry-safe submit buttons, upload cancellation, and success/failure states to voice, image, video, lexicon, RLHF, safety, cultural, and validation flows.
- [ ] Verify submission tracker reads live status, validator count, consensus score, and quality flags.

### Task 9: Complete company campaigns and team permissions

**Files:**
- Modify: `src/screens/CompanyDashboardScreen.tsx`, `src/components/CampaignWizard.tsx`, `src/services/campaignService.ts`, `src/services/companyService.ts`
- Add: company membership/invitation migration and RPCs
- Test: invite, role denial, campaign lifecycle, feed publication, and metrics tests

- [ ] Replace the marketplace maintenance message with live dataset listing and filters.
- [ ] Implement invitation acceptance, role changes, revocation, and owner-only billing/API operations.
- [ ] Validate campaign budgets, reward limits, required metadata, approval, pause/resume, and completion conditions server-side.
- [ ] Reconcile dashboard metrics with submissions, quality, consensus, costs, and remaining budget.

### Task 10: Implement dataset purchase and secure delivery

**Files:**
- Modify: `src/screens/DatasetSalesScreen.tsx`, `src/services/datasetService.ts`, `src/screens/CompanyDashboardScreen.tsx`
- Add: purchase/export Edge Function and licensing/version fields
- Test: purchase idempotency, insufficient funds, signed URL expiry, and access denial

- [ ] Create a purchase ledger with unique buyer/dataset/order keys and server-side authorization.
- [ ] Generate export manifests with provenance, license, schema version, item count, and quality summary.
- [ ] Deliver data through expiring signed URLs or an authenticated export function; never expose public storage objects.
- [ ] Add purchases/library, receipt, failure, retry, and revocation states.

### Task 11: Replace simulated payouts with a real financial state machine

**Files:**
- Modify: `src/screens/WalletScreen.tsx`, `src/screens/PaymentMethodsScreen.tsx`, `src/services/walletService.ts`, `src/services/userService.ts`
- Add: payout provider Edge Function, OTP challenge table/RPC, webhook handler, fee/ledger migration
- Test: method validation, OTP expiry/retry, admin approval, provider success/failure, webhook replay

- [ ] Remove acceptance of `123456` or any arbitrary six-digit code; require a server-created, expiring, single-use challenge.
- [ ] Validate bank/mobile/PayPal/USDT fields by country, currency, and network; restrict display and access to the owner.
- [ ] Add payout status transitions, fees, provider reference, idempotency key, reconciliation, and retry handling.
- [ ] Keep wallet balance derived from an append-only ledger and prevent duplicate or negative settlement.
- [ ] Add the iOS IAP service only if funding digital credits remains in launch scope.

### Task 12: Make admin operations real and auditable

**Files:**
- Modify: `src/screens/AdminScreens.tsx`, `src/services/apiKeyService.ts`, `supabase/functions/*`, relevant SQL migrations
- Test: admin RBAC, moderation, payout, fraud, audit, and API-key flows

- [ ] Replace mock task, session, audit, fraud, and lexicon metrics with typed Supabase queries/RPCs.
- [ ] Enforce admin claims in the database/function layer, not only by hiding UI tiles.
- [ ] Record actor, target, reason, before/after, timestamp, and correlation ID for every mutation.
- [ ] Add fraud review, suspension, dismissal, appeal, and re-open states.
- [ ] Verify API key scopes, rotation, revocation, rate-limit behavior, and request logs.

### Task 13: Complete notifications and platform behavior

**Files:**
- Modify: `src/services/notificationService.ts`, `src/App.tsx`, `app.json`, notification SQL
- Add: notification background task and platform assets where supported
- Test: web no-permission flow, native foreground/background, action tap, deep link, and preference tests

- [ ] Add topic preferences and web in-app notification behavior without invoking native push APIs on web.
- [ ] Add native interactive categories, background handling, custom sounds, Android channels, and deep-link screen routing.
- [ ] Handle revoked permissions, invalid tokens, duplicate notifications, and cleanup of inactive tokens.

### Task 14: Launch hardening and deployed verification

**Files:**
- Modify: `package.json`, `vercel.json`, `.env.example`, `docs/README.md`, deployment/runbook docs
- Add: `tests/e2e/*`, CI/release workflow if repository hosting is configured
- Test: staging and production URL smoke suites

- [ ] Add contributor, company, and admin end-to-end journeys with seeded staging data.
- [ ] Verify accessibility, responsive layout, error states, bundle size, CSP/security headers, caching, and Sentry events.
- [ ] Configure Clerk origins/redirects, Supabase URLs and secrets, Vercel variables, EAS production config, and provider webhooks.
- [ ] Deploy staging, run the complete smoke suite against the deployed URL, then deploy production.
- [ ] Publish rollback, migration, payout reconciliation, key rotation, moderation, and incident runbooks.

## Completion gate

- [ ] `npm run build:web` passes from a clean checkout.
- [ ] Client typecheck and unit tests pass.
- [ ] Web smoke test shows onboarding, auth, contributor dashboard, task submit, wallet, and logout without console errors.
- [ ] Company smoke test covers team, campaign, dataset purchase/export, and API key permissions.
- [ ] Admin smoke test covers moderation, payout approval, fraud, audit, and key revocation.
- [ ] Staging and production database migrations, RLS, Edge Functions, provider webhooks, and secrets are verified.
- [ ] No mock, simulated, maintenance, or arbitrary-OTP path remains in a launch-critical flow.
