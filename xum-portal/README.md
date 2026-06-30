<div align="center">
  <img src="https://raw.githubusercontent.com/my-edutu/xum-portal/main/public/vite.svg" alt="XUM AI Logo" width="120" />

  # 🌐 XUM AI: Global Intelligence Platform

  **Powering the next generation of LLMs and Vision Models with verified, culturally diverse human intelligence.**

  [![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0.5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.dev/)

</div>

---

## 🚀 Overview

The **XUM Portal** serves as the central landing hub and administrative bridge for the **XUM AI** ecosystem. It is designed to attract enterprise partners, onboard waitlist users, and provide secure access to the internal Admin Terminal.

> 💡 **Note for Enterprise Companies & Regular Trainers:**  
> The actual data collection, validation, and dashboard experiences live inside the **XUM AI Mobile Applications** (iOS/Android).

## ✨ Key Features

- **🎨 Premium Dark UI:** An immersive, glass-morphism dark mode aesthetic powered by TailwindCSS and Framer Motion.
- **🛡️ Secure Admin Terminal:** Integrated Clerk authentication tightly coupled with Supabase Role-Based Access Control (RBAC). Only authenticated users with the `admin` role can access the portal.
- **🏢 Enterprise Landing:** A highly converting business landing page showcasing the 5-source data model, global reach, and robust RLHF capabilities.
- **⚡ Performance First:** Built on Vite and React 19 for instantaneous hot-module replacement and lightning-fast load times.

---

## 🏗️ Architecture Stack

XUM AI applies a hybrid architecture to maximize security and scale:

```mermaid
graph TD
    classDef frontend fill:#1E293B,stroke:#3B82F6,stroke-width:2px,color:#fff
    classDef auth fill:#6C47FF,stroke:#fff,stroke-width:2px,color:#fff
    classDef storage fill:#3ECF8E,stroke:#fff,stroke-width:2px,color:#fff
    classDef mobile fill:#F97316,stroke:#fff,stroke-width:2px,color:#fff

    A[XUM Web Portal]:::frontend
    C[Clerk Auth Module]:::auth
    D[(Supabase Database)]:::storage
    E[XUM Mobile Apps]:::mobile

    A -->|"1. Identity Handshake"| C
    A -->|"2. Admin Data & Roles"| D
    
    C -.->|"Syncs Identity"| D
    E -->|"Data Sourcing Engine"| D
```

### 1. The Gateway (`xum-portal`)
This repository! It handles marketing, waitlist conversions, and serves as the locked-down control room for internal staff (`/admin/dashboard`).

### 2. Identity (`Clerk`)
Handles magic links, passwords, and 2FA. Automatically synchronizes new profiles to the Supabase database.

### 3. The Source of Truth (`Supabase`)
PostgreSQL backend containing all trainer data, enterprise prompts, validation schemas, and administrative roles.

---

## 🛠️ Quickstart Guide

### Prerequisites
- Node.js (v20+)
- npm or yarn
- Clerk Publishable Key
- Supabase REST URL & Anon Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/my-edutu/xum-portal.git
   cd xum-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   VITE_SUPABASE_URL=https://...supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

---

## 🔐 Admin Authentication Flow

To access the `<AdminTerminal />`, the application enforces a rigorous check:

1. User clicks **"Admin"** in the footer and is routed to `/auth?intent=admin`.
2. User authenticates via **Clerk**.
3. `AdminContext` intercepts the login and queries the `users` table in **Supabase** via the user's email.
4. If `role === 'admin'` or email is in the Master Admin list (e.g., `info@xumai.app`, `infoafrichainx@gmail.com`), access is granted.
5. If unauthorized, the user is safely redirected back to the homepage (`/`).

---

<div align="center">
  <p>Built with 💙 by the XUM AI Engineering Team</p>
  <p><i>Global Intelligence, Human Verified.</i></p>
</div>
