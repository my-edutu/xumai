# XUM AI - Admin Terminal Documentation

This document serves as the official guide for administrators of the XUM AI platform. It details the features, operational modules, and authority levels within the Admin Terminal.

## 1. Access & Authentication

- **Entry Point**: The Admin Terminal is accessed via the **Control Terminal** login screen.
- **Authentication**: Uses Clerk-based identity verified against the `users` table's `role` column.
- **Security**: Only accounts with the `admin` role can bypass the login gate.

---

## 2. Admin Modules

### 👤 User Management
- **Directory**: View all contributors with real-time stats (Balance, level, Trust Score).
- **Control**: Toggle account status between `active` and `suspended`.
- **Insights**: Monitor the "Trust Score" (0-100) to identify high-quality contributors vs. potential bots.

### ✅ Task Moderation
- **Unified Queue**: Review pending submissions across all media types (Voice, Image, Video, Text).
- **LinguaSense Support**: Specialized review for cultural/linguistic ground-truth data.
- **Metadata Inspection**: View device type, file size, duration, and user location for every submission.
- **Actions**: 
    - **Approve**: Immediately credits the user's wallet with the predefined reward.
    - **Reject**: Removes the item from the queue and resets the submission status.

### 💰 Payouts & Financials
- **Withdrawal Queue**: List of all pending cash-out requests.
- **Payment Details**: full visibility into bank account numbers, SWIFT codes, and Mobile Money details.
- **Manual Settlement**: Admins mark payments as "Sent" and record external transaction references for audit purposes.
- **Refunds**: Rejecting a withdrawal automatically restores the funds to the user's balance.

### 📢 Campaign Orchestration
- **Review System**: Companies/Creators submit "Campaign Requests" which remain pending until admin review.
- **Reward Setting**: Admins have the authority to set or adjust the `Reward Per Item` for any campaign before it goes live.
- **Budgeting**: The system automatically calculates total budget requirements based on target submission counts.

### 🛡️ Fraud Detection
- **Auto-Flagging**: Users with trust scores below **30** are automatically highlighted.
- **Suspension**: One-click suspension for accounts flagged for duplicate submissions or low-quality data.
- **Duplicate Prevention**: Backend integration with `duplicate_hashes` to prevent re-submission of the same media.

### 🌐 Lexicon Orchestrator
- **Coverage Mapping**: Visualize data density across different global languages.
- **Reward Boosting**: Admins can apply multipliers (e.g., 1.5x) to specific underserved languages to incentivize collection.
- **Dataset Generation**: Trigger the conversion of approved submissions into a structured `.zip` or manifest for marketplace listing.

### 📜 Audit Logs
- **Transparency**: Every administrative action (Approve, Reject, Payout, Suspend) is logged with a timestamp and the admin's identity.
- **Accountability**: Supports filtered searches to track specific administrative workflows.

---

## 3. Authority & Permissions

XUM AI utilizes a role-based access control (RBAC) system:

| Role | Authority Level |
|------|-----------------|
| **`admin`** | **Full Access**: Can manage users, approve campaigns, set rewards, and settle financials. |
| **`qa_reviewer`** | **Limited Review**: Specialized access to Task Moderation and Lexicon Orchestration for quality control. |
| **`company`** | **Restricted**: Can create campaign requests and view analytics for their own tasks only. |
| **`contributor`** | **None**: No access to the Admin Terminal; restricted to data collection tasks. |

---

## 4. Operational Workflows

### Approving a New Campaign:
1. Navigate to **Campaign Requests**.
2. Select a pending campaign.
3. Review the `target_submissions` and `task_type`.
4. Enter the `Reward ($ per item)` (e.g., $0.15).
5. Click **Approve & Send** to publish the task to the global marketplace.

### Processing a Withdrawal:
1. Navigate to **Payouts**.
2. Copy the user's bank/payment details.
3. Perform the manual payment via external banking software.
4. Return to the Terminal, enter the transaction reference, and click **Approve & Mark Sent**.
