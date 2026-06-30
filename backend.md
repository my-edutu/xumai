# XUM AI - Backend Architecture Documentation

This document outlines the Supabase backend infrastructure for XUM AI, detailing the data models, business logic (RPCs), security policies, and storage configurations.

## 1. Core Architecture Overview

XUM AI leverages **Supabase** as its primary backend-as-a-service, providing:
- **PostgreSQL Database**: Relational data storage with Row Level Security (RLS).
- **Authentication**: Managed via Clerk (integrated with the `users` table).
- **Storage**: S3-compatible buckets for media capture (Image, Voice, Video).
- **Edge Functions**: (Potentially leveraged for external API integrations like Resend).

---

## 2. Database Schema

### User & Economy Layer
- **`users`**: Extends identity with `streak_count`, `trust_score`, and `balance`.
- **`transactions`**: Immutable ledger of all earnings and payouts.
- **`referrals`**: Tracks user invitations and rewards.

### Task & Submission Layer
- **`tasks`**: The master list of available data collection tasks.
- **`submissions`**: Core table for user contributions.
- **`submission_metadata`**: Enriched data for every submission, including `prompt_text`, `locales`, and technical specs (bitrate, resolution).
- **`featured_tasks`**: Dynamic tasks displayed on the Home/Marketplace screens.
- **`xum_judge_tasks`**: Advanced RLHF and validation tasks.

### specialized Data Collections
- **`lexicon_submissions`**: Cultural linguistic data (concepts/translations).
- **`rlhf_submissions`**: AI response corrections and safety scoring.

### Security & Integrity
- **`fraud_flags`**: Automated flag system for bot detection and anomalous behavior.
- **`duplicate_hashes`**: Content fingerprinting to prevent duplicate data submission.
- **`api_keys` / `api_key_scopes`**: Infrastructure for external service access.

---

## 3. Business Logic (RPC Functions)

To reduce frontend complexity and ensure data integrity, critical logic is handled via Postgres Functions (RPCs):

| Function | Description |
|----------|-------------|
| `get_user_balance` | Securely retrieves only the current user's wallet balance. |
| `update_user_streak` | Logic to increment or reset the daily submission streak. |
| `get_daily_missions` | Fetches tasks with logic to check if they are "locked" based on user experience. |
| `check_judge_unlock` | Determines if a user has met the threshold to become a "XUM Judge". |
| `get_user_earnings_period`| aggregates stats for "Today" and "This Month" dashboards. |

---

## 4. Storage Infrastructure

Media is organized into type-specific buckets with strict RLS policies:

- **`image-captures`**: JPEG/PNG visual training data.
- **`voice-captures`**: Audio recordings (m4a/wav) for linguistic grounding.
- **`video-captures`**: Short gesture and action clips.

**Security Policy**: Only authenticated users can `INSERT` into their own folder (`/user_id/*`), and only admins or the owner can `SELECT`.

---

## 5. Security Model (RLS)

Every table is protected by **Row Level Security**:
- **Public Read**: Restricted to configuration tables like `lexicon_concepts`.
- **Private Read/Write**: Users can only see and modify their own `submissions` and `transactions`.
- **Admin Access**: Managed via the `admin_sessions` and role-based policies.

---

## 6. Development Workflow

### Type Generation
To maintain type safety between the DB and the app:
```bash
npm run generate-types
```
This pulls the latest schema from Supabase and updates `src/types/supabase.ts`.

### Migrations
New features (like the `prompt_text` metadata) are applied via SQL migrations located in `docs/sql/`.
