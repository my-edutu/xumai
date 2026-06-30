# Clerk Authentication Integration

**Date:** January 10, 2026

This document describes how Clerk is integrated into XUM AI for authentication.

---

## Overview

XUM AI uses [Clerk](https://clerk.com) for user authentication instead of Supabase Auth. This provides:

- **Reliable email delivery** - No more issues with verification emails going to spam
- **Pre-built UI components** - Beautiful, customizable sign-in screens
- **Multi-factor authentication** - Easy to enable MFA
- **Social logins** - Google, Apple, GitHub, etc.
- **User management dashboard** - See all users, sessions, ban users

---

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   User Device   │──────│     Clerk       │──────│    Supabase     │
│   (Expo App)    │      │  (Auth Provider)│      │   (Database)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │
                                 │ JWT Token
                                 ▼
                         User synced to 
                         Supabase users table
```

### Flow:
1. User signs in/up via Clerk
2. Clerk issues a JWT token
3. ClerkProvider syncs user data to Supabase `users` table
4. App uses Supabase for all database operations

---

## Setup Instructions

### 1. Create Clerk Account
1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Copy your **Publishable Key** (starts with `pk_`)

### 2. Configure Environment Variables

Add to your `.env.local`:

```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 3. Enable Authentication Methods

In Clerk Dashboard → User & Authentication → Email, Phone, Username:
- Enable **Email address** (required)
- Enable **Password** (required)
- Optionally enable **Phone number**

### 4. Enable Social Logins (Optional)

In Clerk Dashboard → User & Authentication → Social Connections:
- Enable **Google** (requires Google Cloud Console setup)
- Enable **Apple** (requires Apple Developer setup)

### 5. Configure Supabase JWT Template (Optional)

For direct Supabase access with Clerk tokens:
1. Go to Clerk Dashboard → JWT Templates
2. Create a new template named `supabase`
3. Add your Supabase JWT secret

---

## File Structure

```
src/
├── context/
│   └── ClerkProvider.tsx     # Main Clerk provider with Supabase sync
├── screens/
│   └── ClerkAuthScreen.tsx   # Sign in/up screens using Clerk
```

---

## Usage in App

### Wrapping the App

```tsx
// In App.tsx or index.tsx
import { ClerkProvider } from './context/ClerkProvider';

export default function App() {
  return (
    <ClerkProvider>
      {/* Your app content */}
    </ClerkProvider>
  );
}
```

### Using Auth State

```tsx
import { useUser, useAuth, SignedIn, SignedOut } from '../context/ClerkProvider';

function MyComponent() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  
  return (
    <>
      <SignedIn>
        <Text>Hello, {user?.firstName}!</Text>
        <Button onPress={signOut} title="Sign Out" />
      </SignedIn>
      <SignedOut>
        <Text>Please sign in</Text>
      </SignedOut>
    </>
  );
}
```

---

## Supabase User Sync

The `ClerkProvider` automatically syncs Clerk users to Supabase:

```sql
-- Users are upserted into this table
public.users (
  id TEXT PRIMARY KEY,        -- Clerk user ID
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP
)
```

---

## Migration from Supabase Auth

If you have existing users in Supabase Auth:

1. **Export existing users** from Supabase Auth
2. **Import to Clerk** using Clerk's user import API
3. **Update RLS policies** to use Clerk user IDs

---

## Troubleshooting

### "Missing publishable key"
- Ensure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env.local`
- Restart the dev server after adding env vars

### "Verification email not received"
- Check Clerk Dashboard → Logs for delivery status
- Clerk handles email delivery - check spam folder

### "OAuth not working"
- Configure OAuth providers in Clerk Dashboard
- Set up proper redirect URLs for your platform

---

## Resources

- [Clerk Expo Documentation](https://clerk.com/docs/quickstarts/expo)
- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)
- [Clerk Dashboard](https://dashboard.clerk.com)
