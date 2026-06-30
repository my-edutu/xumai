# Post-Launch Roadmap & Remaining Items

This document tracks technical debt, deferred features, and placeholder screens that need implementation after the initial App Store launch.

## 1. High Priority: In-App Purchases (IAP)
- **Status**: Planned (Deferred for Launch)
- **Task**: Replace all digital credit funding with `react-native-iap`.
- **Requirement**: Guideline 3.1.1 compliance for iOS.
- **Components**: `iapService.ts`, `WalletScreen.tsx` modal, Supabase Edge Function for receipt validation.

## 2. Feature Completions (Placeholder Screens)
The following screens currently display professional "Maintenance" or "Initializing" messages and require full logic implementation:

- **Marketplace**: Connect to the company task marketplace database.
- **Team Management**: Implement enterprise member invitation and permission logic in `CompanyDashboardScreen.tsx`.
- **Submission Tracker**: Implement real-time tracking from the `submissions` table in `DashboardScreens.tsx`.
- **Referral Program**: Connect the referral logic to the user reward system.
- **Custom Task Creation**: Enable full task configuration beyond the current maintenance status.

## 3. Financial & Security Enhancements
- **Withdrawal OTP**: Replace the simulated `123456` code with a real Supabase Edge Function that sends unique codes via SMS/Email.
- **Payment Providers**: Expand the `PaymentMethodsScreen.tsx` to include more global banking APIs and USDT network validations.
- **Withdrawal Fees**: Automate fee calculation and reporting for accounting.

## 4. Technical Debt & Polish
- **Linting Cleanup**: Resolve persistent `react-native` member export lint errors across all screen files.
- **Theme Polish**: Refine the Light Mode color contrast (specifically gradients and overlays mentioned by the user).
- **Unit Testing**: Add comprehensive test suites for `userService.ts` and `walletService.ts`.

---
*Created on 2026-03-14*
