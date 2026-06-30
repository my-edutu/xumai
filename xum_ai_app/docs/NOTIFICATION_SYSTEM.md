# XUM AI - Notification System Documentation

This document outlines the architecture, implementation, and future roadmap for the notification system in XUM AI, built on top of `expo-notifications`.

## 1. Current Architecture

The notification system in XUM AI is a hybrid implementation that combines local UI state, Supabase for persistence/history, and Expo Push Service for remote delivery.

### Core Components
- **`NotificationService.ts`**: The central logic hub. Handles permissions, token registration, Supabase syncing, and listener setup.
- **Supabase Integration**:
  - `push_tokens` table: Stores Expo Push Tokens mapped to user IDs and devices.
  - `notifications` table: Stores historical data for the in-app notification center.
  - `user_notification_preferences` & `notification_topics`: Manage user opt-ins for different categories (Tasks, Payments, etc.).
- **App-level Integration**: Listeners initialized in `App.tsx` distribute notification events (received vs. tapped) to the UI.

### Supported Categories
Currently, the system recognizes and styles the following categories in the UI:
- `general`: Basic updates
- `task`: New task availability or status updates
- `payment`: Wallet and payout notifications
- `system`: App-level maintenance or security
- `admin`: Direct messages from administrators
- `promo`: Campaigns and rewards
- `announcements`: Global platform news

---

## 2. Implementation Guide (Expo SDK 53 style)

### Permission Handling
Permissions are requested using `Notifications.requestPermissionsAsync()`. Permission status is tracked to enable/disable UI features gracefully.

### Token Registration
Tokens are obtained via `Notifications.getExpoPushTokenAsync({ projectId })`. This token is essential for targeting specific devices via the Expo Push API.

### Foreground Behavior (Configured)
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

---

## 3. Gap Analysis: Unimplemented Areas

Based on the latest Expo documentation and current codebase audit, the following areas are **not yet implemented** or require refinement:

### A. Interactive Notifications (Action Categories)
**Status:** ❌ *Not Implemented*
We do not currently use `setNotificationCategoryAsync`. We should implement this to allow users to take actions directly from the notification tray.
- **Example:** A "New Task" notification could have buttons for "View Details" and "Accept Task" without opening the app first.

### B. Headless / Background Task Handling
**Status:** ❌ *Not Implemented*
Currently, if the app is closed, we rely on the OS to show the notification. We aren't using `expo-task-manager` and `registerTaskAsync` to run background JavaScript (e.g., to pre-fetch task data or sync local state) when a notification arrives.

### C. Custom Notification Sounds
**Status:** ❌ *Not Implemented*
All notifications use the system default. For a premium experience, we should implement custom `.wav` sounds for `payment` (chime) and `task` (alert) categories via the `sounds` property in `app.json`.

### D. Advanced Android Channel Management
**Status:** ⚠️ *Partial*
We create basic channels (`default`, `tasks`, `payments`), but we don't handle channel deletion, group management, or dynamic channel updates based on user preferences.

### E. Exact Alarm Permissions (Android 12+)
**Status:** ❌ *Not Implemented*
For time-sensitive task reminders (e.g., "Your task expires in 10 minutes"), we need to request and handle `android.permission.SCHEDULE_EXACT_ALARM`.

---

## 4. Technical Strategy for Completion

### Step 1: Background Tasks
Install `expo-task-manager` and define a background task to handle remote data sync.
```typescript
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data }) => {
  // Logic to sync data in background
});
```

### Step 2: Interactive Actions
Define categories in `NotificationService.registerForPushNotifications`:
```typescript
await Notifications.setNotificationCategoryAsync('task_invitation', [
  { identifier: 'accept', buttonTitle: 'Accept Now', options: { opensAppToForeground: true } },
  { identifier: 'decline', buttonTitle: 'Decline', options: { isDestructive: true } }
]);
```

### Step 3: Deep Linking Integration
Refine the `App.tsx` listener to support robust URL-based deep linking using `expo-linking`, rather than just a `screen` string.

---

## 5. Maintenance & Debugging
- **Physical Device Required**: Push notifications cannot be tested on simulators.
- **EAS Build**: Most notification changes (icons, colors, sounds) require a full native build (`eas build`) to take effect.
- **Token Validity**: The `push_tokens` table should be cleaned periodically using the `is_active` flag.
