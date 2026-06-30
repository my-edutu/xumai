# XUM AI — Improvement Roadmap
> Generated: 2026-02-20 | Based on feature docs (features.md, feature 3.md, features 2) + full codebase review

---

## 1. Flow Confirmation (What's Actually Built)

### Main App — Navigation Flow
```
SPLASH → ONBOARDING → AUTH (Clerk) → OTP_VERIFICATION
  └─ ACCOUNT_TYPE_SELECT
       ├─ [user]    → SKILL_SETUP → LANGUAGE_SELECTION → TASK_INTERESTS → HOME
       └─ [company] → COMPANY_DASHBOARD

HOME (featured tasks + daily missions + feed)
  ├─ TASK_MARKETPLACE → [select task] → VOICE/IMAGE/VIDEO/VALIDATION/LINGUASENSE task
  ├─ XUM_JUDGE (gated — requires unlock)
  ├─ WALLET → PAYMENT_METHODS, LEADERBOARD
  ├─ PROFILE → EDIT_PROFILE, RECORDS
  └─ ContributorHubModal → SETTINGS, NOTIFICATIONS, SUPPORT, APPEARANCE_LABS
```

### Admin Panel (Separate React/Vite Web App)
```
/analytics        → Platform KPIs
/user-directory   → User list, search, enroll
/task-governance  → Task batches, arbitration
/linguasense      → Language dataset management
/datasets         → Dataset inventory, export
/payout-vaults    → Payout queue, approve/reject
/business-ledger  → Financial tracking
/governance       → System rules & policies
```

### Data Pipeline Flow (from docs → confirmed in code)
```
User submits (voice/image/video/text)
  → Supabase Storage upload (taskService.ts)
  → Metadata saved (language, country, env, noise_level)
  → Validation queue (validation task type exists)
  → Reward credited (Supabase RPC → wallet balance)
  → Real-time notification pushed (notificationService.ts)
  → Admin reviews via Admin Panel or in-app AdminScreens
```

---

## 2. Gap Analysis — Docs vs Implementation

| Feature (Documented) | Status | Notes |
|---|---|---|
| Auth (Clerk, OTP, Onboarding) | ✅ Done | Working |
| Voice / Image / Video tasks | ✅ Done | Screens + service |
| Wallet, Transactions, Leaderboard | ✅ Done | RPC-based |
| XUM Judge (RLHF) | ✅ Partial | Screen exists, unlock gate in place, but `RLHF_CORRECTION` screen not wired |
| XUM Lexicon (Local Language) | ⚠️ Partial | `LinguaSenseEngineScreen` exists as "Lab" — not surfaced in main nav as a featured task type |
| Validation Tasks | ✅ Done | `ValidationTaskScreen` + service |
| Profile, Edit Profile, Records | ✅ Done | |
| Notifications (real-time) | ✅ Done | Supabase subscription + local push |
| Payment Methods | ✅ Done | Screen exists |
| Referral System | ❌ Missing | `REFERRALS` in ScreenName enum, no screen built |
| Dedicated Withdraw Screen | ❌ Missing | `WITHDRAW` in enum, merged into WalletScreen instead |
| Submission Tracker | ❌ Missing | `SUBMISSION_TRACKER` in enum, no screen |
| RLHF Correction (Advanced) | ❌ Missing | `RLHF_CORRECTION` in enum, no screen |
| Streak / Accuracy Bonuses | ❌ Missing | Mentioned in features 2, no UI or logic found |
| Admin — 15-module dashboard (feature 3.md) | ⚠️ Partial | Admin Panel has ~8/15 modules; in-app admin has 6 screens |
| Admin — Lexicon Module | ❌ Missing | Not in Admin Panel |
| Admin — RLHF/Quality Module | ❌ Missing | Not in Admin Panel |
| Admin — Enterprise/Clients Module | ❌ Missing | Not in Admin Panel |
| Admin — API & Keys Module | ❌ Missing | Not in Admin Panel |
| Admin — Audit Logs | ❌ Missing | Critical per feature 3.md |
| Admin — Session Control (RBAC) | ❌ Missing | No role-based access control implemented |
| Company Dashboard | ⚠️ Partial | Basic screen exists, no real functionality |
| Environmental Sensing | ⚠️ Lab | Screen exists but not featured |
| Prompt Genius | ⚠️ Lab | Screen exists but not featured |
| Gap Dashboard | ⚠️ Lab | Screen exists but not featured |

---

## 3. Improvements by Priority

---

### 🔴 Priority 1 — Critical Gaps (Build These First)

#### 3.1 Wire the RLHF Correction Screen
- `RLHF_CORRECTION` is declared in `ScreenName` enum but has no screen file
- Per features.md: "Advanced RLHF" allows users to rewrite AI answers in local cultural context
- **Action:** Build `src/screens/tasks/RLHFCorrectionScreen.tsx`
  - Show AI prompt + AI answer
  - Text area for user rewrite
  - Cultural context selector (language/region)
  - Submit + reward flow
  - Wire in `App.tsx` case and link from `XumJudgeScreen`

#### 3.2 XUM Lexicon as a First-Class Task Type (Not a Lab Feature)
- Features.md explicitly maps Lexicon to **Create** tab → prominent card
- Currently buried as `LinguaSenseEngineScreen` under "Lab" category
- **Action:**
  - Create `src/screens/tasks/LexiconTaskScreen.tsx` (not just the engine)
  - User flow: Concept shown (e.g., 🐕 Dog) → pick Text / Voice / Both → submit word + pronunciation + meaning
  - Surface it in `HomeScreen` or `TaskMarketplaceScreen` as a task category
  - Add `LEXICON_TASK` to `ScreenName` enum
  - Ensure metadata captures: `concept`, `language`, `local_word`, `pronunciation_url`, `cultural_note`

#### 3.3 Referral System Screen
- `REFERRALS` exists in enum but has no screen
- Referral bonuses mentioned in features 2 as a payout type
- **Action:** Build `src/screens/ReferralsScreen.tsx`
  - Unique referral code (generate from user ID)
  - Copy/Share link buttons
  - Referral history table (who joined, reward earned)
  - Progress toward referral milestones
  - Link from `ContributorHubModal` and `ProfileScreen`

#### 3.4 Submission Tracker Screen
- `SUBMISSION_TRACKER` in enum, no screen
- **Action:** Build `src/screens/SubmissionTrackerScreen.tsx`
  - List user's pending / approved / rejected submissions
  - Filter by task type, status, date
  - Tap to view details (media preview, rejection reason, reward)
  - This is different from `RecordsScreen` — it's real-time pipeline status

#### 3.5 Admin Audit Logs
- Feature 3.md calls Audit Logs "non-negotiable"
- Not present anywhere in Admin Panel
- **Action:** Add `/audit-logs` page to Admin Panel
  - Table: timestamp, admin user, action type, resource ID, before/after value
  - Filter by admin, action type, date range
  - Export to CSV
  - Supabase table: `audit_logs(id, admin_id, action, resource_type, resource_id, payload, created_at)`

---

### 🟠 Priority 2 — Feature Completeness

#### 3.6 Dedicated Withdraw Screen
- `WITHDRAW` in enum, currently merged into WalletScreen
- **Action:** Extract into `src/screens/WithdrawScreen.tsx`
  - Amount input with balance check
  - Payment method selector (links to `PAYMENT_METHODS`)
  - Transaction fee display
  - Confirm + biometric/PIN confirmation
  - Success state with estimated arrival time
  - Navigate to it from `WalletScreen` "Withdraw" button

#### 3.7 Streak & Accuracy Bonus System
- Mentioned in features 2: accuracy bonuses, streak rewards
- No UI or backend logic exists
- **Action:**
  - Add `streak_count`, `accuracy_score`, `bonus_multiplier` columns to `users` table (if not present)
  - Display streak flame 🔥 on `HomeScreen` header
  - Show bonus indicator on task cards ("2x reward today — streak active!")
  - Add streak logic in `taskService.ts` on submission success
  - Notify user on streak milestones (Day 3, 7, 14, 30)

#### 3.8 Admin Panel — Lexicon Module
- feature 3.md section 6: Lexicon dashboard with concepts, language coverage map, dispute rate
- **Action:** Add `/linguasense/lexicon` page to Admin Panel
  - Table of concepts with per-language coverage
  - Pronunciation audio playback (inline)
  - Validator vote breakdown (4/5 agree, etc.)
  - Flag disputed entries for human resolution
  - Export lexicon pack by language

#### 3.9 Admin Panel — RBAC (Roles & Permissions)
- feature 3.md section C: 7 roles defined (Super Admin, Ops Admin, QA Reviewer, etc.)
- No RBAC implementation exists
- **Action:**
  - Add `role` column to admin users table: `super_admin | ops_admin | qa_reviewer | payments_admin | enterprise_admin | dataset_publisher | moderator`
  - Wrap Admin Panel pages with role-based route guards
  - `AdminContext.tsx` already exists — add `role` and `permissions` to it
  - Show/hide sidebar nav items based on role

#### 3.10 Admin Panel — Session Control Panel
- feature 3.md section B: shows active admin sessions, force logout, block IP
- **Action:** Add `/settings/sessions` page to Admin Panel
  - Table: admin name, device/browser, IP, country, login time, last active, status
  - Actions: Force logout, Require re-auth, Block IP

---

### 🟡 Priority 3 — Quality & Architecture

#### 3.11 Remove Dead Supabase Auth Code
- `ForgotPasswordScreen` in `AuthScreensNative.tsx` still calls `supabase.auth.resetPasswordForEmail`
- App uses Clerk — this should call Clerk's password reset
- **Action:** Replace with `useSignIn().signIn.create({ strategy: 'reset_password_email_code', identifier: email })`
- Also remove any other `supabase.auth.*` references in screens

#### 3.12 Video Upload — Replace Base64 with Streaming
- `taskService.ts` converts video to base64 before upload
- This causes OOM crashes on videos > 30s
- **Action:**
  - Use `FileSystem.uploadAsync()` from `expo-file-system` for direct multipart upload to Supabase Storage
  - Or use Supabase JS `storage.from().upload()` with a Blob/File reference
  - Add upload progress bar to `VideoTaskScreen`

#### 3.13 Service Layer — Add Error Retry & Typed Errors
- All services return `{ data, error }` but callers handle errors inconsistently
- No retry logic for network failures
- **Action:**
  - Create `src/utils/serviceUtils.ts` with `withRetry(fn, maxAttempts=3)` wrapper
  - Define typed error codes: `UPLOAD_FAILED | QUOTA_EXCEEDED | NOT_QUALIFIED | NETWORK_ERROR`
  - Show user-friendly error toasts in task screens

#### 3.14 Offline Support for Task Capture
- Users in Africa/LATAM may have intermittent connectivity
- Captured media is lost if upload fails
- **Action:**
  - Use `AsyncStorage` to queue failed uploads with file URIs
  - Background upload retry when connectivity restored
  - Show "X uploads pending" badge on HomeScreen

#### 3.15 Admin Panel — Enterprise/Clients Module
- feature 3.md section 10: Client accounts, projects, invoices, SLAs, deliverables
- **Action:** Add `/enterprise` page to Admin Panel
  - Client list with contract status
  - Per-client dataset delivery tracker
  - Invoice generation (PDF export)
  - SLA compliance meter (% delivered on time)

#### 3.16 Admin Panel — API & Keys Module
- feature 3.md section 11: API key management, scopes, rate limits, webhooks
- **Action:** Add `/api-keys` page to Admin Panel
  - Create/revoke API keys with scope selection
  - Usage analytics per key (requests/day)
  - Webhook endpoint configuration
  - Supabase table: `api_keys(id, name, key_hash, scopes[], rate_limit, owner_id, created_at, revoked_at)`

---

### 🟢 Priority 4 — UX Polish

#### 3.17 Bottom Navigation — Add "Create" Tab
- features.md defines 5 tabs: **Home | Task | + (Create) | Wallet | Menu**
- Current `BottomNavigation.tsx` has: HOME | TASK | ADD | WALLET | MENU
- "ADD" tab behavior needs to route to a Create hub (XUM Lexicon, Capture Data, Voice & Media)
- **Action:** When "ADD" is tapped, show a bottom sheet or dedicated screen:
  ```
  Create Hub
  ├── 📸 Capture Data  → IMAGE_TASK / VIDEO_TASK selection
  ├── 🧠 XUM Lexicon   → LEXICON_TASK
  └── 🎙 Voice & Media → VOICE_TASK
  ```

#### 3.18 Company Dashboard — Build It Out
- `CompanyDashboardScreen` is a placeholder
- Per features 2: companies buy datasets, monitor pipelines, request custom RLHF
- **Action:** Add sections:
  - Active dataset orders (status: collecting / validating / ready)
  - Download ready datasets
  - Submit custom task request form
  - Billing summary

#### 3.19 Onboarding — Add Skill & Language Selection
- `SKILL_SETUP`, `LANGUAGE_SELECTION`, `TASK_INTERESTS` screens exist
- Unclear if they're all shown in the onboarding flow
- **Action:** Ensure full onboarding funnel: Account Type → Skills → Languages → Interests → HOME
- Skip-able but rewarded (badge for completing full profile)

#### 3.20 Localization (i18n)
- `LanguageSelectionScreen` exists but app is English-only
- XUM targets Africa, LATAM, Asia — contributors likely speak French, Portuguese, Swahili, Hindi
- **Action:**
  - Add `i18n-js` or `expo-localization` + `i18next`
  - Start with top 5 languages: English, French, Portuguese, Swahili, Hindi
  - Translate: auth screens, home screen, task prompts

---

## 4. Admin Panel — Missing Modules Summary

| Module (feature 3.md) | Admin Panel Status | Action |
|---|---|---|
| Dashboard Home (KPIs + charts) | ✅ Analytics page | Add charts (user growth, quality trend) |
| Users Module | ✅ User Directory | Add accuracy breakdown, flag history |
| Tasks Module | ✅ Task Governance | Add task builder UI |
| Submissions Pipeline | ❌ Missing | Build `/submissions` page |
| Datasets Module | ✅ Datasets page | Add versioning, marketplace publish |
| Lexicon Module | ❌ Missing | Build `/linguasense/lexicon` |
| RLHF / XUM Judge Module | ❌ Missing | Build `/rlhf` |
| Payments Module | ✅ Payout Vaults | Add dispute handling |
| Quality & Fraud Module | ❌ Missing | Build `/quality` |
| Enterprise/Clients | ❌ Missing | Build `/enterprise` |
| API & Keys | ❌ Missing | Build `/api-keys` |
| Analytics | ✅ Analytics | Expand with revenue vs payouts chart |
| Settings | ⚠️ Partial | Add system settings |
| Audit Logs | ❌ Missing | **Critical** — Build `/audit-logs` |
| Session Control + RBAC | ❌ Missing | Build `/settings/sessions` + role guards |

---

## 5. Recommended Build Order

```
Sprint 1 (Core gaps — user-facing)
  [ ] RLHF Correction Screen
  [ ] Lexicon as first-class task type
  [ ] Referral Screen
  [ ] Submission Tracker Screen
  [ ] Fix ForgotPassword to use Clerk

Sprint 2 (Wallet & incentives)
  [ ] Dedicated Withdraw Screen
  [ ] Streak + Accuracy Bonus UI
  [ ] Offline upload queue
  [ ] Video upload — replace base64

Sprint 3 (Admin Panel completeness)
  [ ] Audit Logs page
  [ ] RBAC implementation
  [ ] Submissions pipeline page
  [ ] Lexicon module page
  [ ] Session control panel

Sprint 4 (Platform features)
  [ ] Enterprise/Clients module
  [ ] API & Keys module
  [ ] Quality & Fraud module
  [ ] Company Dashboard build-out

Sprint 5 (Polish & scale)
  [ ] i18n (5 languages)
  [ ] Create Hub bottom sheet
  [ ] Error retry + typed errors
  [ ] Full onboarding funnel validation
```

---

## 6. Data Schema Additions Needed

```sql
-- Streak tracking
ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_submission_date DATE;
ALTER TABLE users ADD COLUMN accuracy_score DECIMAL(5,2) DEFAULT 0;

-- Lexicon task type
CREATE TABLE lexicon_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  concept TEXT NOT NULL,          -- e.g. "dog"
  language TEXT NOT NULL,         -- e.g. "ha" (Hausa)
  local_word TEXT NOT NULL,       -- e.g. "Kare"
  cultural_note TEXT,
  pronunciation_url TEXT,         -- Supabase Storage URL
  validator_votes INTEGER DEFAULT 0,
  approved BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  action TEXT NOT NULL,           -- e.g. "approve_payout", "reject_submission"
  resource_type TEXT,             -- e.g. "payout", "user", "task"
  resource_id TEXT,
  payload JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] DEFAULT '{}',
  rate_limit INTEGER DEFAULT 1000,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  reward_amount DECIMAL(10,2) DEFAULT 0,
  paid_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Quick Wins (< 1 day each)

1. **Fix dead import** — Remove `sendAuthEmail` references (`src/utils/mailer.ts` deleted)
2. **Fix ForgotPassword** — Replace `supabase.auth.resetPasswordForEmail` with Clerk
3. **Wire REFERRALS screen** — Add case in `App.tsx` + link from Profile
4. **Wire WITHDRAW screen** — Add case in `App.tsx` + extract from WalletScreen
5. **Add streak display** — `HomeScreen` header: streak count + flame emoji
6. **Surface XUM Judge unlock** — Make unlock requirements visible on `XumJudgeScreen`
7. **Bottom nav ADD → Create Hub** — Bottom sheet with 3 options instead of dead route
