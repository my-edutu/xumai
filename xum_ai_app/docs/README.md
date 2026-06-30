# XUM AI - Decentralized AI Data Grounding Platform

XUM AI is a high-performance, decentralized platform designed for high-quality AI data collection, grounding, and validation. It connects companies needing massive datasets for AI training (particularly for underrepresented languages and cultural contexts) with a global network of contributors who earn rewards for their participation.

## 🚀 Project Overview

The XUM AI ecosystem consists of several core components working in harmony to provide an end-to-end pipeline for data acquisition:

1.  **Contributor App (User App):** A cross-platform mobile and web application where users discover tasks, capture media (audio, video, images), validate data, and manage their earnings.
2.  **Admin Panel:** A comprehensive management interface for platform administrators to moderate tasks, manage users, and process payouts.
3.  **Company Data Portal:** A specialized interface for data customers (companies) to deploy "Grounding Nodes," monitor campaign progress, and export high-purity datasets (e.g., in Parquet format).

## 🛠 Tech Stack

-   **Frontend:** React Native (Expo) for cross-platform mobile support, leveraging Vite for high-performance web distribution.
-   **Styling:** NativeWind / Tailwind CSS for a unified, modern, and responsive design system.
-   **Backend:** Supabase (Auth, PostgreSQL DB, Edge Functions) for real-time data and scalable infrastructure.
-   **Storage:** S3-compatible object storage (e.g., Hetzner S3) for large-scale media assets and datasets.
-   **Animations:** Linear Gradient and CSS/Native transitions for a premium, high-fidelity user experience.

## 📁 Project Structure

```text
XUM AI/
├── assets/             # Images, fonts, and static assets
├── components/         # Reusable UI components (Shared, Layouts)
├── contexts/           # React Context providers (User, Auth, Theme)
├── screens/            # Core application screens
│   ├── AuthScreens.tsx      # Onboarding, Login, Register, OTP
│   ├── DashboardScreens.tsx # Home, Wallet, Profile, Leaderboard, Support
│   ├── TaskScreens.tsx      # Task Marketplace, Media Capture, Task Details
│   ├── AdminScreens.tsx     # Admin Dashboard, User Mgmt, Moderation
│   └── CompanyScreens.tsx   # Company-specific views and portals
├── supabaseClient.ts   # Configuration for Supabase integration
├── types.ts            # Global TypeScript interfaces and enums
├── App.tsx             # Main application entry and navigation logic
├── package.json        # Project dependencies and scripts
├── vite.config.ts      # Vite configuration for web builds
└── docs/               # Detailed documentation
    ├── ARCHITECTURE.md # System architecture and navigation flow
    ├── DATA_MODELS.md  # Type definitions and data schemas
    └── CONTRIBUTING.md # Development guides and style standards
```

## 📚 Documentation

For more detailed information, please refer to:
-   **[Architecture Guide](docs/ARCHITECTURE.md)**: Deep dive into the app's structure, navigation, and backend integration.
-   **[Data Models](docs/DATA_MODELS.md)**: Understanding the core TypeScript interfaces (`User`, `Task`, etc.).
-   **[Contributing](docs/CONTRIBUTING.md)**: Setup guide, styling conventions, and "Prototype Mode" details.

## ✨ Core Features

### 👤 Contributor App (User App)
-   **Multi-Modal Data Capture:** Support for Audio, Video, Photo, and Text-based tasks.
-   **Gamified Experience:** XP systems, leveling, and leaderboards to drive engagement.
-   **Financial Dashboard:** Wallet for tracking earnings, transaction history, and managing withdrawals to various payment methods.
-   **Task Marketplace:** Intelligent task matching based on user skills and locations.
-   **Referral System:** Incentive program for expanding the contributor network.

### 🛡 Admin Panel
-   **User Management:** Audit and manage user accounts and roles.
-   **Task Moderation:** Review submitted payloads for quality assurance.
-   **Payout Processing:** Automated and manual settlement of user earnings.
-   **Platform Analytics:** Monitor growth, task completion rates, and financial health.

### 🏢 Company Data Portal (Linguasense)
-   **Campaign Deployment:** Create and manage large-scale data grounding projects.
-   **Real-time Analytics:** Track data "purity," sample counts, and progress.
-   **Data Export:** Securely download datasets in optimized formats (Parquet) for AI training.
-   **API Management:** Control access tokens for integration with external AI pipelines.

## 🌈 Theming System

XUM AI features a sophisticated, dynamic theming engine with built-in support for multiple premium aesthetics:
-   **Midnight:** Classic dark blue professional theme.
-   **Emerald:** Focus on growth and green accents.
-   **Solar:** High-energy gold and amber theme.
-   **Amoled:** Pure black for OLED efficiency and high contrast.
-   **Night:** Deep slate for reduced eye strain.
-   **Crimson:** Bold red accents for a high-intensity feel.

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   Expo CLI (`npm install -g expo-cli`)
-   Supabase Project (URL and Anon Key)

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables in `.env.local`:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

### Development
-   **Mobile (Expo):** `npm start`
-   **Web (Vite):** `npm run dev`

### Building
-   **Android APK:** `npm run build:apk`
-   **Web Bundle:** `npm run build`

## 🔮 Roadmap
-   [ ] Full migration from Prototype Mode to live Supabase Backend.
-   [ ] Enhanced AI-assisted pre-moderation for task submissions.
-   [ ] Offline support for data capture in low-connectivity areas.
-   [ ] Expansion of Linguasense dashboard for automated dataset versioning.

---
© 2025 XUM AI. All Rights Reserved.
