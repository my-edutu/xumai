# Qualification assessments — controlled launch runbook

**Implementation state:** GitHub code only until applied to the correct XUM Supabase project and the app/Edge functions are redeployed. This is a qualification pilot, **not a paid-job or withdrawal launch**.

## Important: actual XUM Supabase project

The Expo app source currently identifies the XUM database URL as `https://gkhemshbwmealgxczykk.supabase.co`. That project **was not among the Supabase projects connected to ChatGPT** during this work. Do not run the migrations against a similarly named project or assume a previous database migration has been deployed.

Before making any live changes, confirm the deployed Dokploy/EAS environment URL matches the intended project, then connect that exact Supabase project with permissions to inspect migrations and RLS. Do not paste its service-role secrets into chat, client environment variables or source control.

## Implemented

- `202610130003_qualification_assessments.sql` — private multiple-choice question bank and correct answers, server-graded ten-question attempts, twenty-minute timeout, max three attempts per 24 hours per verified contributor, immutable scoring and trusted `qualification_scoring` evidence.
- `public.start_my_qualification_v1()` — only signed Clerk account, verified identity link, approved published policy, active program and sufficient private question bank. Resumes a current attempt; returns question prompts/options but never answer keys.
- `public.submit_my_qualification_v1(...)` — one-shot, complete answers only, locked to the signed-in user, time-bound, idempotent by submission ID, server grades and records task-count and accuracy evidence. No reward posting is possible.
- `admin_request_qualification_activation_v1` and `admin_confirm_qualification_activation_v1` — separate authorized reviewer, active policy and at least ten privately reviewed questions required before qualification alone can be activated.
- New contributor UI in Earn → Monetization Center for answering the timed exam and viewing verified score.
- Admin → Monetization → Launch activation requests and separate reviewer approvals.
- `202610130004_withdrawal_freeze.sql` — revokes browser execution grants on a **known list** of legacy withdrawal RPCs. It does not prove every historic or service-role payout path is closed; audit actual project.
- The Wallet withdrawal controls, withdrawal service adapter and request-withdrawal Edge Function are **fail-closed in this commit**. **The live site is not locked by this source change until its app and Edge Function are deployed.**

## Production activation prerequisites and order

1. Audit **the actual XUM Supabase project** read-only: schema, identity subjects, deployed functions, RLS, webhook/payment state, wallet balances and outstanding withdrawals. Snapshot/backup before migration.
2. Configure Supabase to validate JWTs from the actual Clerk instance. Test a real signed non-admin and admin token, issuer, audience and verified `sub` claims, and verify that unauthenticated clients cannot access private bank/identity data.
3. Resolve trusted Clerk-subject ↔ legacy UUID mapping. Never link accounts merely by matching email. Missing/ambiguous links stay pending; no qualification possible.
4. Apply migrations **001 → 002 → 003 → 004** on a disposable staging clone, confirm repeatability, RLS and raw payment path review. Do **not** enable any paid campaign/payout or change existing real-money balances.
5. **Privately** write and review at least 10 distinct high-quality assessment questions, including fraud, originality, labeling quality, consent, duplicate handling and task instructions. The question bank and correct choices must not be stored in publicly accessible GitHub files. Use service-role-only administration or a separately audited authoring pipeline. Do not seed publicly disclosed CI answers into real environments.
6. Publish an effective-dated V1 qualification policy with a separate `policy_draft` creator and `policy_publish` reviewer.
7. Provision `policy_publish` and `eligibility_review` grants to two verified, distinct operator Clerk identities using **trusted server-role tooling**. The application hardcoded admin email list is NOT an authorization control for the new RPCs.
8. Open Admin → Monetization → Launch. Operator A requests qualification activation and shares request ID; operator B approves. The server verifies an adequate question bank and current published policy, then sets only `identity_bridge_enabled` and `qualification_enabled`.
9. Test a sample Clerk user on staging: ten distinct private questions load, keyboard/select focus works on mobile, correct score returned, completed event replay credits no extra signals, expired and cross-user attempts rejected, three-attempt daily rate limit and backend fraud/qualification status behavior verified.
10. Confirm **earnings_enabled=false** and **withdrawals_enabled=false**, Wallet and Edge return a paused response, and no public withdrawal RPC grants remain. Confirm that existing deposits/charges and financial liabilities are not inadvertently altered. Legacy service-role payment functions and processor webhooks require separate inspection.
11. Redeploy the contributor app and AdminPanel (latest `main`) and the withdrawal Edge Function. Do not equate an app redeploy with the Supabase Edge Function/migrations being deployed automatically.
12. Only a later, separate finance-approved release should connect funded work to a double-entry ledger, paid balances, KYC or settlement. **A good qualification score is not payment authorization.**

## Explicit risks and limitations

- No actual signed Clerk identity tests or XUM production data checks have run because the project is not connected.
- There is no private production question bank or verified evidence ingestion pipeline yet. The assessor cannot responsibly open enrollment with test-only answer keys.
- Qualification score records are trustworthy only to the extent that answer keys, question review and signed identity provenance are protected.
- The standalone monetization program's withdrawal flag is constrained to false, but older existing payout/balance routines may still be callable until **actual** database/Edge changes are applied and audited.
- Existing real-money testing infrastructure is intentionally not modified or assumed correct.
- If `pg_proc` inventory reveals additional withdrawal/payout endpoints, add narrowly scoped revocations and regression tests before claiming live withdraws are blocked.

### Validation gate

Do not announce **“Qualification now active for all contributors”** or **“Withdrawals locked in production”** until the named XUM Supabase project, secure question bank, Clerk token verification, owner-approved migration run, and deployed services have been verified end to end.
