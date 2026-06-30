  Feature 1 — XUM Lexicon + XUM Judge: ~60% Complete

  XUM Lexicon

  ┌──────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
  │                                      │                                   Status                                    │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ UI screen (LexiconTaskScreen)        │ ✅ Full — concept selector, text/voice/both modes, cultural note, recording │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ Voice upload to Supabase Storage     │ ✅ Working                                                                  │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ Saves to lexicon_submissions table   │ ✅ Working                                                                  │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ Hardcoded fallback concepts (8)      │ ⚠️ Mock fallback if Supabase fails — acceptable for now                    │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ Human validation layer (consensus)   │ ✅ Built — SubmissionValidationScreen + validationService (3-vote consensus)│
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ Quality scoring (SNR, clarity)       │ ❌ Missing — consensus_score tracked but no audio SNR/blur analysis         │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ Dataset structuring from submissions │ ✅ Built — datasetService.ts creates named datasets from approved items     │
  └──────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘

  XUM Judge (RLHF)

  ┌───────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────┐
  │                                                           │                         Status                          │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ XumJudgeScreen (locked/unlock UI)                         │ ✅ Built                                                 │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ RLHFCorrectionScreen (rewrite + reason + cultural region) │ ✅ Built — real tasks from rlhf_tasks table (no mock)   │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ ValidationTaskScreen (A vs B comparison)                  │ ⚠️ Built — still uses hardcoded mock tasks              │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Saves to rlhf_submissions table                           │ ✅ Working                                               │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ 10 real cultural RLHF tasks seeded in DB                  │ ✅ Done — feature3_migration.sql seeds rlhf_tasks table  │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Unlock check (10 task threshold)                          │ ⚠️ Basic, no accuracy/quality criterion                  │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Safety Scoring task type                                  │ ❌ Missing                                               │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Cultural Appropriateness task type                        │ ❌ Missing                                               │
  ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Gold standard calibration / inter-rater agreement         │ ❌ Missing                                               │
  └───────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────┘

  ---
  Feature 2 — Full Engine/Workflow: ~70% Complete

  ┌────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐
  │                          Step                          │                            Status                            │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Step 1: User onboarding & auth                         │ ✅ Full                                                      │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Step 2: Task types assigned                            │ ✅ Voice, Image, Video, Lexicon, RLHF screens exist          │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Step 3: Data submission                                │ ✅ All types save to Supabase                                │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Layer 1 — Pre-check (size/duration/duplicate)          │ ✅ Built — preCheckService.ts integrated in Voice/Image/Video│
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Layer 2 — Human validation (3-vote consensus)          │ ✅ Built — validationService.ts + SubmissionValidationScreen  │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Layer 3 — Quality scoring / consensus tracking         │ ✅ Partial — consensus_score + validator_count persisted;    │
  │                                                        │ ⚠️ No audio SNR, blur, or NSFW AI scoring yet               │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Step 5: Data structuring into datasets                 │ ✅ Built — datasetService.ts (approved → datasets table)     │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Step 6: Marketplace (dataset packs for sale)           │ ⚠️ Task browsing exists, dataset sales not built             │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Step 7: Enterprise client purchase/API                 │ ❌ Not built                                                 │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Step 8: User payouts (bank/mobile money/USDT)          │ ⚠️ Wallet balance tracked, no real bank/mobile withdrawal    │
  ├────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Step 9: Continuous loop                                │ ⚠️ Tasks refetch on demand, no automation                    │
  └────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘

  ---
  Feature 3 — Admin Dashboard + Real Data: ~65% Complete

  ┌─────────────────────────┬─────────┬─────────────┬───────────────────────────────────────────────────────────┐
  │         Module          │   UI    │  Real Data  │                          Notes                            │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Dashboard/Analytics     │ ✅      │ ?           │ AnalyticsDashboard exists, data source unverified         │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Users                   │ ✅      │ ✅ Supabase │ Pagination, search, trust score — works                  │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Tasks (TaskGovernance)  │ ✅      │ Mock        │ UI with metrics cards, mock task flow                    │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Submissions Pipeline    │ Partial │ ✅ Partial  │ SubmissionTrackerScreen queries real submissions table    │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Lexicon (Linguasense)   │ ✅      │ Mock        │ Admin AI orchestrator UI, no real data                   │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ RLHF/XUM Judge admin    │ ❌      │ N/A         │ No dedicated admin module                                │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Payments (PayoutVaults) │ ?       │ ?           │ Referenced but not confirmed                             │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Quality & Fraud         │ ✅      │ Mock        │ Flag detection UI, ban buttons, no real logic            │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Datasets                │ ✅      │ ✅ Supabase │ datasetService.ts + datasets/dataset_items tables built  │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Leaderboard             │ ✅      │ ✅ Supabase │ Global/Country/Weekly tabs, real rank via RPC, no mock   │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Clients/Enterprise      │ ❌      │ N/A         │ Completely missing                                       │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ API Keys                │ ?       │ ?           │ Page exists, not audited                                 │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Sessions                │ ✅      │ Mock        │ Admin session control UI, all mock data                  │
  ├─────────────────────────┼─────────┼─────────────┼───────────────────────────────────────────────────────────┤
  │ Audit Logs              │ ✅      │ Mock        │ Full log UI with filtering, all mock data                │
  └─────────────────────────┴─────────┴─────────────┴───────────────────────────────────────────────────────────┘

  User-Facing Screens — Mock Data Status

  ┌──────────────────────────────────┬───────────────────────────────────────────────────────────────────────────┐
  │             Screen               │                               Status                                      │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ LeaderboardScreen                │ ✅ Real — Global/Country/Weekly tabs, live Supabase data, no mock          │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ RLHFCorrectionScreen             │ ✅ Real — loads from rlhf_tasks table, empty state when no tasks          │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ ValidationTaskScreen             │ ⚠️ Mock — hardcoded A/B comparison tasks, needs DB table                  │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ ProfileScreen                    │ ✅ Real — memberSince from Clerk createdAt, level badge from earnings      │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ SettingsScreen (Language)        │ ✅ Real — reads user.languages from Supabase users table                  │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ SubmissionTrackerScreen          │ ✅ Real — queries submissions table with validator_count + consensus_score │
  └──────────────────────────────────┴───────────────────────────────────────────────────────────────────────────┘

  SQL Migrations Needed (run in Supabase before testing)

  ┌────────────────────────────┬───────────────────────────────────────────────────────────────────────────┐
  │           File             │                               Contents                                    │
  ├────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ docs/feature2_migration.sql│ submission_validations, duplicate_hashes, datasets, dataset_items + RLS   │
  ├────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ docs/feature3_migration.sql│ user_leaderboard view (+ country), user_weekly_leaderboard view,          │
  │                            │ get_user_global_rank RPC, rlhf_tasks table, rlhf_submissions table,       │
  │                            │ 10 seeded RLHF correction tasks, RLS policies                             │
  └────────────────────────────┴───────────────────────────────────────────────────────────────────────────┘

  ---
  Overall Verdict

  ┌─────────────────────────────┬──────────────────────────┐
  │           Feature           │        Completion        │
  ├─────────────────────────────┼──────────────────────────┤
  │ Feature 1 (Lexicon + RLHF)  │ ~60%                     │
  ├─────────────────────────────┼──────────────────────────┤
  │ Feature 2 (Engine/Workflow) │ ~70%                     │
  ├─────────────────────────────┼──────────────────────────┤
  │ Feature 3 (Admin Dashboard) │ ~65%                     │
  ├─────────────────────────────┼──────────────────────────┤
  │ App overall                 │ ~60% production-ready    │
  └─────────────────────────────┴──────────────────────────┘

  Remaining gaps:
  1. ValidationTaskScreen still uses hardcoded mock A/B tasks — needs a real DB table
  2. Audio/image quality AI scoring (SNR, blur, NSFW) — Layer 1 pre-check is file-level only
  3. Real withdrawal flow — wallet balance exists but no bank/mobile money/USDT payout integration
  4. Enterprise/client module missing from admin entirely
  5. Admin mock modules — sessions, audit logs, fraud, lexicon orchestrator all have UI but no real data
  6. Marketplace dataset sales — browsing exists, purchase/API delivery not built
  7. Safety Scoring + Cultural Appropriateness task types not built in XUM Judge

- [ ] Add `prompt_text` to `submission_metadata` table and service logic <!-- id: 12 -->
- [ ] Add loading overlay/enhanced state to submission buttons <!-- id: 13 -->
- [x] Create walkthrough documentation <!-- id: 3 -->
- [x] Finalize Human Validation UI
    - [x] Test generic submission validation flow
    - [x] Verify consensus logic for multiple sources
    - [x] Ensure real data flow for Lexicon and RLHF validations
- [x] Implement Marketplace Integration
    - [x] Add `publishDatasetToMarketplace` to `DatasetService.ts`
    - [x] Create `AdminMarketplaceManagementScreen` in `AdminScreens.tsx`
    - [x] Add navigation to the new screen
- [x] Database Schema Synchronization
    - [x] Apply `gap_migrations.sql` and `rpc_functions.sql`
    - [x] Fix `user_id` type mismatches (UUID -> TEXT)
    - [x] Seed real tasks for Home and Marketplace screens
