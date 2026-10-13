# XUM AI Monetization Program — V1 product and implementation contract

**Status:** Proposed MVP specification. **Not deployed.** This document does not authorize enabling live payouts or charging customers.

## Purpose

XUM rewards **verified, useful, high-quality human intelligence**, not account registration, uploads, clicks, artificial engagement, or referrals.

**Contributor journey:** Create value → prove quality → unlock monetization → earn → pass verification → withdraw.

Every paid assignment must disclose its price, the approval standard, its payment terms, and any disclosed bonus before the contributor accepts it.

## 1. Status and contributor level: separate dimensions

The four user-facing progression labels are: Not Monetized → Monetization Eligible → Monetized → Trusted/Expert Contributor.

Under the hood, do **not** represent Trusted or Expert as a wallet/payment state. Store independently:

- **Monetization status:** not_monetized, eligible, monetized, paused, rejected (and an appeal/review workflow).
- **Contributor level:** trainee (L0), verified (L1), trusted (L2), judge (L3), expert (L4).
- **Qualifications:** separately per language, domain, task type, and validation specialty; a single overall score never grants every capability.
- **Payout eligibility:** a distinct server-calculated decision; a monetized account can still be unable to withdraw due to KYC, unavailable balance, legal restrictions, or a narrowly scoped review hold.

Display the original simple progression in the UI; keep backend state precise so audits and reversals are unambiguous.

## 2. Proposed launch qualification criteria

All values are admin-configurable, versioned and country-aware. These are **product defaults**, not verified legal thresholds:

| Signal | MVP default |
| --- | --- |
| Account verification | Verified email and, when phone is required, verified phone; self-entered numbers do not count as verified |
| Minimum age | 18 years for paid tasks |
| Profile completeness | At least 80%, with a documented server-side field formula |
| Training | XUM Academy onboarding completed |
| Qualification assessments | At least 10, with unique graded assessments |
| Qualification accuracy | At least 80% on genuine calibration/gold tasks |
| Valid, approved contributions | At least 10 |
| Serious integrity violations | None unresolved |
| Duplicate/high-risk fraud flags | None unresolved; human review with appeal |
| Consent | Accepted current contributor terms and relevant data-rights/license versions |
| Payment/KYC verification | **Required before withdrawal**, not necessarily before training or eligibility |

**No signup bonus or automatic earning unlock.** Qualification tasks are not paid unless explicitly advertised as paid work; never retroactively reclassify unpaid work into paid work without consent.

### Monetization decision

The server produces a versioned decision with: status, threshold values, measured signals, unmet requirements, reviewer/reason codes, measured_at, effective_from, policy_version, and an immutable audit reference. The client displays the returned decision and can never override it.

No evidence or unavailable score means **not qualified**, not a silent pass. Missing training/verification data is not inferred from an account being old or active.

## 3. Task funding and reward obligations

Offer exactly labelled modes:
1. **Client funded**: customer funds a protected worker budget *before* paid slots go live.
2. **XUM funded**: XUM explicitly reserves its own worker acquisition budget in advance.
3. **Discovery/community**: clearly **unpaid**, separately consented and never represented as an earning opportunity.

Payment is **per approved valid unit**, not per uploaded file. Sequence: submitted → QC pending → validated → approved/rejected → reward pending → available (after hold) → paid (following successful provider confirmation).

Show the exact reward currency and unit, units per job, maximum payable units, quality bonus rules, approval/review time, dispute policy and eligibility before task acceptance. Use fixed monetary minor units (integer NGN kobo, USD cents etc. where supported) or exact DECIMAL; never JS floating-point balance math.

Suggested relative bands: basic classification (low); labeling, speech and basic data creation (medium); video, validators and XUM Judge (medium-high); RLHF, rare-language and qualified XUM Domains (high/premium).

**Accounting policy:** whether a dataset is sold later must not change the contributor's entitlement on a previously accepted paid campaign. Never inadvertently run both task-approval payment and dataset-sale revenue sharing on the same obligation. Any optional revenue-share program must be separately described, consented to, and accounted for.

## 4. Validation and quality

Maintain task-specific competency records. Quality signals can include hidden gold items, reviewer agreement, acceptance history, consistency, duplicate checks, domain/language calibration and policy compliance.

- Do not use task speed alone as a positive quality signal.
- Do not pay solely from consensus on subjective preference rankings; use calibrated reasoning and disagreement-aware review.
- XUM Lexicon: original author → qualified language validators (normally 2–3 as justified) → adjudicated consensus → approve/reject → author/validator rewards.
- XUM Judge: separate training, qualifying calibration (suggested 80%), and controlled access to judge tasks; do not let a general 80% score imply Judge authorization.
- XUM Domains: verified professional qualification where appropriate and domain-specific tests; stricter oversight for healthcare, finance and legal annotations.

Proposed progression: L1 ≥80% and monetized; L2 ≥100 approved tasks, ≥90% quality and low rejection with no unresolved serious flags; L3 separate judge qualification; L4 verified specialty and assessment. Admin-configurable minimum evidence/sample count must prevent passing based on one unusually lucky response.

## 5. Wallet and double-entry ledger

The Earn area must show four distinct quantities **in each currency**: Pending, Available, On Hold, Withdrawn (lifetime). Each transaction must have a unique business event reference, created_by/process, immutable audit metadata and original task/submission/campaign reference.

Financial **source of truth** is an append-only, balanced double-entry ledger with separately controlled pending, available, held and paid accounts. Wallet balance is a derived read model, never the only record. Ledger postings must occur in a database transaction and satisfy debits = credits for each currency. Adjustments reverse or offset previous entries; do not overwrite history.

- An approved, compensated submission creates a **unique** reward obligation keyed by submission ID + reward rule/version (no double credit on retries).
- Work pending QC is **not** available for withdrawal.
- Fraud holds move/mark disputed sums with clear reason and release/appeal path; unrelated funds remain available.
- Release pending → available only once, after risk/review hold passes.
- Withdrawal reservation atomically moves available → withdrawal escrow before provider dispatch.
- Provider confirmed paid atomically settles escrow; failed/cancelled payouts release escrow exactly once.
- Process webhook notifications idempotently by provider event ID AND payout intent ID; verify signatures.
- Reconcile local ledger to processor settlements with daily discrepancy monitoring; make discrepancies a release blocker.

Never count company escrow as earned worker cash or mix currencies inside a single unconverted account. Any FX is an explicit priced conversion with recorded rate, timestamp and fees.

## 6. Withdrawals and configurable rules

Example Nigeria launch setting: NGN minimum withdrawal **₦5,000**, not hard-coded. Configure thresholds by country, payment rail, currency, settlement period, provider fee, risk limit and hold time. Do not invent GH/Kenya thresholds before bank/provider validation.

Backend checks before requesting payout:
- monetization status monetized and not paused;
- 18+ and applicable local restrictions met;
- payment method / identity verification complete;
- sufficient *available* same-currency funds and amount above rail-specific minimum;
- no scoped payout hold or unresolved high-risk case;
- withdrawal velocity/duplicate request and provider limits;
- strong, server-side authentication and step-up verification.

Payout lifecycle: requested → reserved → processing → paid OR failed/refunded/review. User interface never marks paid before authentic provider settlement confirmation. Provider API credentials live only in server secrets.

## 7. Fraud response, rights and appeals

Detect suspected duplicate media, repeated audio, automation, device/account farms, impossible completion times, GPS spoofing (only where location is legitimately necessary), validator collusion, recycled answers and coordinated manipulation. Fraud scores **flag for review**; automatic seizure of wages is prohibited.

Case workflow: Flag → Hold (scope, reason, duration) → Reviewer decision → Notification → Appeal → Second review → Release or documented adjustment. Preserve consent and data rights, minimize collected device/location data, and separate payout identity from pseudonymous dataset identity. Do not export email, phone, bank details or identity documents in enterprise datasets.

Record accepted_at, terms_version, consent_version, dataset_license_version, lawful basis and retention policy. Require appropriate Nigerian privacy, employment/contract and tax advice before production payout launch; do not state that a configurable threshold itself constitutes compliance.

## 8. Contributor application

Add a dedicated **Earn → Monetization Center**:
- exact monetization status, current contributor level and progress;
- checklist for account and optional phone verification, age, profile completeness, Academy, assessments, score, approved submissions, consents and fraud clearance;
- show measurable progress, measured_at, unresolved steps and specific training recommendations;
- separate accessible competency cards for languages, task categories, Judge and Domains;
- paid campaign cards with disclosed reward terms; unmistakable unpaid Discovery labels;
- wallet cards: Pending, Available, On Hold, Withdrawn, with ledger-history explanations;
- withdrawal disabled with **server-provided reasons**, not client-calculated approvals;
- accessible review/appeal paths and downloadable receipt/history.

No hard-coded sample monetary balances or fake approvals on a production endpoint.

## 9. Admin operations

Add **Admin → Monetization** views:
Overview; Eligibility Rules; Qualification/Academy; Rewards and Funding; Quality Bonuses; Country/Withdrawal Settings; KYC; Payout Queue; Fraud Holds; Appeals; Ledger; Reports; Audit Trail.

All monetary/rule modifications require audited elevated access. Important rule changes are effective-dated/versioned and never retroactively change accepted task compensation. Record who changed what and why. Manual adjustments require dual review or equivalent separation of duties. Include read-only incident controls to disable **new** payouts without deleting existing obligations.

### Configurable eligibility defaults
- min_age 18;
- min_profile_completeness 80;
- min_qualification_tasks 10;
- min_qualification_accuracy 80;
- min_approved_contributions 10;
- require_training true;
- require_current_consent true;
- require_verified_email true;
- require_phone_verification according to program and market;
- country and category policies;
- reviewer/appeal rules.

### Configurable reward/funding defaults
- base/validation/bonus amounts per currency and unit;
- max_units_per_contributor;
- reserved_worker_budget, committed liabilities, remaining budget;
- currency-specific min withdrawals and hold periods;
- campaign funding source (customer/XUM);
- publish blocked if available funded worker budget < maximum offered obligation.

## 10. Data ownership and backend boundaries

**Server authority:** User + identity service → task acceptance/submissions → QC and independent validators → qualification engine → monetization decision engine → ledger → payment/withdrawal orchestrator. The mobile/web app is a read-only presenter of decisions except authenticated requests such as task submission, consent acceptance and withdrawal initiation. Supabase RLS grants must not allow the app to directly update monetization states, payout status or ledger rows.

Recommended entities (map to existing schema first, never add parallel unaccounted money systems):
- contributor_identity_map (stable canonical internal contributor ID; protected Clerk mapping)
- monetization_policy_versions, monetization_rule_overrides, monetization_decisions, decision_evidence
- academy_completions, qualification_attempts, task_competencies, contributor_levels
- quality_assessments, submission_validation_decisions, fraud_cases, fraud_appeals
- campaign_funding_sources, campaign_budget_reservations, task_reward_contracts
- immutable financial_accounts, financial_journals, financial_postings
- withdrawal_intents, payout_attempts, verified_processor_events, settlement_reconciliations
- consent_acceptances, country_rail_rules, administrator_audit_log

Schema changes must use tested, incremental migrations. Distinguish existing transaction history and analytics projections from the new ledger's source of truth. All policy calculations, reward approval and payouts require request-level idempotency and race-safe database transactions.

## 11. Repository-specific findings and migration blockers

**Do not activate payments just because the UI exists.** Repository inspection found:

1. The existing contributor monetization service, xum_ai_app/src/services/monetizationThresholdService.ts, uses a target **follower count (default 1000)**. This is **incompatible** with qualification/quality eligibility. Before launch, identify every caller and replace it with the authoritative server decision, not a separate client rule.
2. supabase/13_dataset_monetization.sql and supabase/17_worker_revenue_distribution.sql include dataset-sale revenue splits, while supabase/03_business_logic.sql and supabase/21_wallet_budget_integration.sql contain task approval/reward behavior. Reconcile these so the same work is never credited twice.
3. supabase/20_automated_payout_infrastructure.sql still increments public.users.balance on finalizing batches. supabase/26_withdrawal_otp.sql uses a different cash/withdrawal path. Both must be reconciled to **one** balanced ledger and payout state machine before live use.
4. supabase/README.md explicitly flags a **Clerk string-subject vs Supabase UUID auth.users/user ID incompatibility**. Resolve canonical identity and verify RLS before backfilling contributor or wallet records.
5. xum_ai_app/src/services/qualityService.ts explicitly treats some pre-upload checks as client-side heuristics. Never treat these scores as financial approval proof.
6. The repository has **two admin implementations** and a separate my-edutu/xum-portal repo. Pick the active, deployed AdminPanel as owner of rule controls; do not update a stale duplicate and assume operators can use it.
7. The existing client wallet RPCs and withdrawal Edge Function must be verified against the deployed database, not assumed safe because the TypeScript build passes.
8. Documentation says the Supabase bootstrap must be tested in disposable staging and is not proof of production schema presence.

This V1 specification deliberately leaves existing payment integrations unchanged until those release blockers are resolved.

## 12. Implementation sequence and acceptance gates

**Phase A — Foundation / blockers**
- Confirm production app repo and deployed AdminPanel build root.
- Map Clerk user IDs to stable internal contributor IDs; unit/integration test RLS.
- Inventory all balance mutations, approval triggers, payout handlers and dataset-sale split paths.
- Introduce a kill switch defaulting **OFF** for payout and reward posting; retain read-only balances.
- Agree UX/legal text for adult paid participation, quality review, rejections, consent and appeals.
- Define retention, fraud evidence access and audit roles.
**Exit:** migration/identity reconciliation report reviewed; no current direct money paths bypass proposed ledger.

**Phase B — Policy & qualification MVP**
- Effective-dated, versioned admin rules with immutable rule-change audits.
- Academy completion, qualification attempts, measured competency and reviewable eligibility decisions.
- Monetization Center displays server decisions; no synthetic status.
**Exit:** 18+, missing evidence, score under 80%, fraud hold, and valid success cases tested; no client writes to status.

**Phase C — Funded task commitments and ledger**
- Fund worker liabilities before advertising any paid work.
- Implement balanced ledger, task-level idempotent approval postings, pending/available/held projections and adjustment trace.
- Integrate Lexicon validations and scoped judge/domain qualification.
**Exit:** retries/concurrent approvals do not double-credit; budget never goes negative; invariant checks pass.

**Phase D — Payouts (disabled outside provider sandbox)**
- Configure NGN pilot minimum ₦5,000 through admin; KYC/payment verification and verified receipt.
- Withdrawal escrow, signed webhooks, failed-payout compensations, rate limits, manual review and dispute/appeal.
- Close all older withdrawal/payout bypasses.
**Exit:** duplicate webhook/OTP replay/network retries are idempotent; balance and processor reconciliation test pass.

**Phase E — Controlled launch**
- Preview with internal testers on zero-money tasks, then sandbox paid tasks, then a capped funded pilot.
- Review fraud false positives, quality distributions, rejection explanations and support tickets.
- Monitor available balances, held obligations, total funded worker liability and paid settlement.
- Obtain jurisdiction-appropriate tax/privacy/payment advice before full public payouts.
**Exit:** finance and security owners explicitly approve the production feature flag.

## 13. Nonnegotiable acceptance tests

- Newly registered account cannot earn or withdraw simply from registration.
- Verified phone status cannot be inferred from a user-entered phone field.
- Training/qualification evidence and quality scores are verifiable server-side.
- Correctly approved task pays **once** despite submission replay, multiple validators, or duplicate webhook events.
- Rejected duplicate units never become available.
- Pending or held earnings cannot be withdrawn.
- A withdrawal cannot reserve more money than the same-currency available ledger balance.
- Provider failure returns escrow once, without modifying historical ledger events.
- Altering a rule cannot retroactively change pre-agreed reward amounts.
- Admin rule changes, holds, appeals and adjustments are audit-visible and permission checked.
- Dataset sale does not delay payout for prior approved paid work or double-credit a contributor.
- User can see why a reward/monetization request was accepted or denied.
- Any identity/RLS mismatch prevents payout execution instead of falling back to a privileged client.
- Never deploy payout posting on the basis of frontend-only tests.

**Owner decisions to confirm before money goes live:** funded pilot amount/currency, initial payment rails/providers, the exact meaning of 80% profile completion, whether phone verification is required for all paid markets, qualification-task rubric/sample size, consent/licensing templates, and who is authorized to perform dual-review payout adjustments.
