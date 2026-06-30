# XUM AI Admin Panel - Internal Documentation
**Version**: 1.0 (Initial Setup)

---

## 🏗️ Architecture
The Admin Panel is a standalone React application built with Vite and TypeScript. It shares the same Supabase backend as the main XUM AI application but utilizes a distinct role-based permission set.

### Directory Structure
- `src/pages`: Individual dashboard modules (Users, Tasks, Submissions).
- `src/components`: Reusable UI elements (Tables, Stat Cards, Navigation).
- `src/contexts`: Global state managers (Admin Auth, Platform Stats).
- `doc/`: Admin-specific development and operations guides.

---

## 🔐 Role-Based Access Control (RBAC)
Admins must have the `role = 'admin'` in the `public.users` table. Access is enforced by:
1. **Frontend Guard**: Protected routes checking the user's role metadata.
2. **Backend RLS**: Tables labeled with `admin-only` access policies.

---

## 📋 Core Modules
### 1. Overview Dashboard
- High-level KPIs: Active Users, Retention, Payout Volume, Flagged Submissions.
- Real-time activity feed.

### 2. User Management
- Detailed profile view.
- Trust score adjustment.
- Account suspension/banning.

### 3. Task Management
- Visual builder for multi-modal tasks.
- Batch task creation from JSON/CSV.
- Inventory control and pricing.

### 4. Financial Operations
- Payout approval queue.
- Transaction history and reconciliation.
- Crypto/Paypal provider status monitoring.

---

## 🛠️ Sync with Primary App
- **Database**: Both apps connect to the same Supabase project.
- **Environment**: Shared `.env` keys (URL/Anon Key).
- **Triggers**: Actions in Admin (e.g., approving a submission) trigger triggers in the common database to update user balances.
