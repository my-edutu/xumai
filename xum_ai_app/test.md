# XUM AI — Metadata Feature Testing Guide

## How It Works

Metadata is **100% automatic**. Users do nothing.
Every submission is silently enriched with user profile + prompt context + device info.
Admins see the full picture in the moderation dashboard. Data is stored in `submission_metadata`.

---

## What Gets Auto-Attached Per Submission

| Field | Source | Example |
|-------|--------|---------|
| `user_name` | `users.full_name` | "Amaka Obi" |
| `user_language` | `users.preferred_language` | "yo" (Yoruba) |
| `user_country` | `users.location` | "Nigeria" |
| `user_role` | `users.role` | "contributor" |
| `user_level` | `users.level` | 7 |
| `task_type` | Task screen | "voice" / "image" / "video" |
| `task_category` | `capture_prompts.category` | "Pronunciation" |
| `difficulty_level` | `capture_prompts.difficulty_level` | 1 (Easy) |
| `prompt_id` | The prompt answered | UUID |
| `platform` | `Platform.OS` | "android" |
| `file_size_bytes` | Device file info | 284672 |
| `duration_seconds` | Recording timer | 8 |
| `consent_given` | Always true on submit | true |

> **Zero extra steps for the user.** Everything is derived from their profile + the active prompt + device.

---

## Step 0 — Apply SQL Migrations (Required, in order)

Run both files in your **Supabase SQL Editor**:

1. `supabase/28_metadata_schema.sql` — creates the `submission_metadata` table + initial views
2. `supabase/29_metadata_enrichment.sql` — adds user profile + prompt columns + updated views

---

## Step 1 — Ensure User Profile Has Language Set

The user's language and country come from the `users` table (`preferred_language`, `location`).
Make sure the test user has these filled in (set during onboarding / LanguageSelection screen).

In Supabase, verify:
```sql
SELECT id, full_name, preferred_language, location, role, level
FROM public.users
WHERE id = '<your-test-user-id>';
```

If `preferred_language` is NULL, navigate through the app's language selection screen to set it.

---

## Step 2 — Do Any Voice / Image / Video Task

1. Log in as a contributor.
2. Complete a Voice, Image, or Video task normally. SUBMIT as usual.
3. No extra prompts appear. The submission goes through.

---

## Step 3 — Verify in Supabase

```sql
-- See the full auto-attached metadata for the latest submission
SELECT
    sm.user_name,
    sm.user_language,
    sm.user_country,
    sm.user_role,
    sm.user_level,
    sm.task_type,
    sm.task_category,
    sm.difficulty_level,
    sm.platform,
    sm.duration_seconds,
    sm.file_size_bytes,
    sm.captured_at
FROM public.submission_metadata sm
ORDER BY sm.captured_at DESC
LIMIT 5;
```

**Expected result:** Every column populated from the user's profile + prompt + device.

---

## Step 4 — Check Admin Moderation View

1. Log in as admin → **Admin Dashboard → Task Moderation**.
2. Each pending submission card now shows tag pills for:
   - **Blue** — contributor name
   - **Purple** — language (e.g. `YO`)
   - **Cyan** — country (e.g. `Nigeria`)
   - **Green** — role (`contributor`)
   - **Amber** — level (e.g. `Lvl 7`)
   - **Pink** — task category (e.g. `Pronunciation`)
   - **Red/Yellow/Green** — difficulty (Hard / Medium / Easy)
   - **Indigo** — platform (`ios` / `android`)
   - **Gray** — duration (`8s`) and file size (`278kb`)

---

## Step 5 — Analytics Queries

### Language distribution
```sql
SELECT * FROM public.metadata_language_stats LIMIT 20;
```

### Coverage map (who's submitting what, where)
```sql
SELECT * FROM public.metadata_coverage_map LIMIT 20;
```

### Contributor breakdown
```sql
SELECT * FROM public.metadata_contributor_stats LIMIT 20;
```

### Category & difficulty breakdown
```sql
SELECT * FROM public.metadata_category_stats;
```

### Dataset summary for enterprise export
```sql
-- Approved Yoruba voice submissions
SELECT public.get_dataset_metadata_summary('voice', 'yo', NULL);
```

---

## Step 6 — Enterprise Filter Example

```sql
-- "All approved voice data from Yoruba speakers in Nigeria, difficulty ≤ 2"
SELECT s.submission_data->>'file_url' AS file_url, sm.*
FROM submissions s
JOIN submission_metadata sm ON sm.submission_id = s.id
WHERE s.status = 'approved'
  AND sm.task_type = 'voice'
  AND sm.user_language = 'yo'
  AND sm.user_country = 'Nigeria'
  AND sm.difficulty_level <= 2
ORDER BY sm.captured_at DESC;
```

---

## Schema Reference

```
submission_metadata
├── id                UUID (PK)
├── submission_id     UUID → submissions.id
│
├── — USER PROFILE (auto from users table) ─────────────────
├── user_name         TEXT   e.g. "Amaka Obi"
├── user_language     TEXT   e.g. "yo"  (preferred_language)
├── user_country      TEXT   e.g. "Nigeria"  (location)
├── user_role         TEXT   e.g. "contributor"
├── user_level        INT    e.g. 7
│
├── — TASK / PROMPT CONTEXT (auto from capture_prompts) ────
├── task_type         TEXT   'voice' | 'image' | 'video' | ...
├── task_category     TEXT   e.g. "Pronunciation", "Signs"
├── difficulty_level  INT    1=Easy  2=Medium  3=Hard
├── prompt_id         UUID   the exact prompt answered
│
├── — DEVICE / FILE (auto from device) ─────────────────────
├── platform          TEXT   'ios' | 'android' | 'web'
├── file_size_bytes   BIGINT
├── duration_seconds  INT    (voice / video only)
│
├── — SYSTEM ────────────────────────────────────────────────
├── consent_given     BOOLEAN  always true
└── captured_at       TIMESTAMPTZ
```
