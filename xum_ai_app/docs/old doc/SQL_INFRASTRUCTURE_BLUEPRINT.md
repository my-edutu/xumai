# 🏗️ XUM AI: SQL & Backend Infrastructure Blueprint

**Authored by:** @theagent.md  
**Target:** Enterprise-Grade Scalability & Stakeholder Flexibility

This document audits the current state of XUM AI's PostgreSQL infrastructure and provides a strategic roadmap for the "Next-Gen" backend, ensuring the platform can handle complex multi-company campaigns, rigorous quality control, and advanced user engagement.

---

## 🔍 1. Current Infrastructure Audit (Supabase)
The platform utilizes a **Unified Infrastructure** strategy where a single set of core tables serves the Admin Panel, Company Portal, and XUM AI Mobile App.

| Core Table | Unified Mobile View | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `users` | `profiles` | Contributor identity & XP stats. | ✅ Unified |
| `tasks` | `capture_prompts` | Shared definitions of work prompts. | ✅ Unified |
| `submissions` | `task_submissions` | Central proof-of-work repository. | ✅ Unified |
| `companies` | - | Multi-tenant corporate clients. | ✅ Deployed |
| `campaigns` | - | Data budgets and quotas. | ✅ Deployed |
| `notifications` | - | Real-time cross-platform alerts. | ✅ Synced |
| `withdrawals` | - | Financial settlement engine. | ✅ Deployed |
| `featured_tasks`| - | Mobile-specific UX promos. | ✅ Deployed |
| `admin_tasks` | - | Daily missions & Judge Logic. | ✅ Deployed |
| `user_activities`| - | Activity tracking logs. | ✅ Deployed |

---

## 🚀 2. Proposed "Enterprise" Infrastructure Extensions
To scale to a large-scale company model with flexible Admin/Company/User interactions, we need to implement the following modules.

### A. Multi-Tenant Company Module
*Currently, tasks exist in a vacuum. We need a hierarchy where companies (AI Researchers) own the data requests.*

1.  **`companies`**: Details about the entity requesting data (Logo, API keys, Billing status).
2.  **`company_members`**: Link `auth.users` to `companies` with roles (`manager`, `viewer`, `billing`).
3.  **`campaigns`**: 
    *   Links `capture_prompts` to a specific company objective.
    *   **Fields**: `target_count`, `remaining_budget`, `start_at`, `end_at`, `is_private`.
    *   **Logic**: Automatically pause prompts when campaign budget or quota is met.

### B. Automated Quality Control (QC) & Consensus Pipeline
*Moving beyond manual Admin approval to a "XUM Judge" powered ecosystem.*

1.  **`qc_assignments`**: Queue system to distribute user submissions to "Judges."
2.  **`qc_consensus`**: 
    *   Required when 3+ judges review the same file.
    *   **Logic**: If 2/3 agree, auto-approve/reject. If split, escalate to Admin.
3.  **`judge_scores`**: Tracking the accuracy of user-judges to prune "bad actors."

### C. Engagement & Loyalty Engine (Gamification v2)
*Deepening the retention loop.*

1.  **`badges`**: Definitions (e.g., "50 Voice Samples", "Night Owl").
2.  **`user_badges`**: The link between users and their achievements.
3.  **`streaks`**: Tracking consecutive days active with multiplier logic (stored in DB for integrity).
4.  **`referral_cycles`**: Multi-level tracking for user growth.

### D. Advanced Communication & Notification Layer
*Crucial for platform feedback.*

1.  **`notifications`**: Persistent store for user alerts (Submission approved, Payment sent).
2.  **`announcements`**: Global messages from Admins to Users or Companies.
3.  **`support_tickets`**: Integrated help-desk directly in the DB for RLS-protected support.

### E. Dataset & Export Infrastructure
*The "Product" for companies.*

1.  **`dataset_bundles`**: Grouping approved submissions into exportable versions (v1.0, v1.1).
2.  **`download_logs`**: Tracking when and who from a company downloaded the data for compliance and billing.

---

## 🛡️ 3. Infrastructure "Stability" Principles
To ensure we don't "break components" during growth:

1.  **Logical Isolation (Postgres Schemas)**:
    *   `public`: User/App facing.
    *   `client_portal`: Company/Partner facing.
    *   `internal_audit`: Admin-only history.
2.  **Versioning via `computed columns` & `triggers`**:
    *   Never delete financial records; use soft deletes or status transitions.
3.  **Partitioning Strategy**:
    *   Partition `user_activities` and `task_submissions` by `created_at` (Monthly partitions) to maintain query speed as we hit millions of rows.
4.  **Strict RLS (Row Level Security)**:
    *   `CREATE POLICY "Companies can only see their own campaigns"`
    *   `CREATE POLICY "Users can only see active prompts for their region"`

---

## ⚡ 4. Edge Services & Logic Layer
*The "Intelligence" that powers the database.*

1.  **`pre-validation-service`**: (Edge Function) Before a submission hits the DB, run a check for audio silence, image blur, or video corruption.
2.  **`payout-workflow`**: (Edge Function) Integrations with Stripe/PayPal/Local Bank APIs for automated settlement.
3.  **`report-generator`**: (Edge Function) Periodically generates PDF/Excel performance reports for Companies.
4.  **`notification-pusher`**: (Edge Function) Triggered by DB changes to send real-time push/email alerts.

---

## 🛠️ 5. Immediate Next SQL Steps
I propose drafting the following migration files immediately:
1.  `009_multi_tenancy_setup.sql`: Companies & Campaigns.
2.  `010_notification_system.sql`: In-app notification engine.
3.  `011_gamification_v2.sql`: Badges & Achievement triggers.

**@theagent.md** | *Engineering the future of AI Data Collection.*
