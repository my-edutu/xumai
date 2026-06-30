# XUM AI Data Models

This document defines the core data structures used throughout the application. These interfaces ensure type safety and consistent data handling across the Frontend and (eventually) the Backend database schema.

## 👥 User & Profile

### `User`
Represents the potentially public-facing profile stats of a contributor.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Display name of the user. |
| `level` | `number` | Current gamification level (e.g. 1-100). |
| `currentXp` | `number` | Experience points earned in current level. |
| `targetXp` | `number` | Experience points needed to reach next level. |
| `balance` | `number` | Withdrawable earnings in USD. |

*In `UserContext.tsx`, there is also an internal `UserProfile` interface handling role-based access control.*

## 📋 Tasks

### `Task` (Generic)
The fundamental unit of work in the Marketplace.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `title` | `string` | Short display title. |
| `description` | `string` | Value proposition or brief instruction. |
| `reward` | `number` | Payment amount (USD). |
| `xp` | `number` | Gamification reward. |
| `timeEstimate` | `string` | Expected duration (e.g., "5m"). |
| `difficulty` | `enum` | `Easy`, `Medium`, `Hard`. |
| `type` | `enum` | `audio`, `text`, `image`, `validation`, `linguasense`. |
| `priority` | `boolean` | If true, highlighted in UI (e.g. "Urgent"). |

### `LinguasenseTask`
A specialized task type for the Language Grounding campaigns.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `prompt` | `string` | The text or scenario the user must respond to. |
| `context` | `string` | (Optional) Additional background info. |
| `type` | `enum` | `text`, `voice`, `both`. |
| `reward` | `number` | Specific reward for this micro-task. |
| `xp` | `number` | Specific XP. |
| `targetLanguage` | `string` | The language requested (e.g., "Yoruba", "Swahili"). |

## ⚙️ Enums

### `ScreenName`
The central registry for all navigation routes. It is split into logical functional groups:
-   **Auth:** `SPLASH`...`OTP_VERIFICATION`
-   **User Dashboard:** `HOME`...`REFERRALS`
-   **Tasks:** `TASK_MARKETPLACE`...`RLHF_CORRECTION`
-   **Admin:** `ADMIN_LOGIN`...`ADMIN_PAYOUTS`
-   **Company:** `LINGUASENSE_PORTAL`...

*See `types.ts` for the complete list.*
