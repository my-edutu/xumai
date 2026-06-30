# 🔐 Supabase Authentication Setup Guide

This document outlines how to configure and use Supabase Authentication with the XUM AI mobile app, specifically focusing on **Email OTP** and **Magic Links**.

---

## 1. Supabase Dashboard Configuration

### Enable Email Auth
1. Go to your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **Providers**.
3. Ensure **Email** is enabled.
4. Toggle **Confirm Email** if you want users to verify their email before their first login.
5. Toggle **Secure email change** for additional security.

### Enable OTP / Magic Links
1. In the same **Email** provider settings:
2. Ensure **Enable Magic Links** is toggled **ON**.
3. (Optional) Adjust the **OTP Expiry** (default is 3600 seconds).

### Configure Redirect URLs (Deep Linking)
For Magic Links to work on mobile, you must configure the Redirect URLs so Supabase knows how to send the user back to the app.
1. Go to **Authentication** > **URL Configuration**.
2. Add your Expo/App URL schemes:
   - `xum://auth-callback` (for production/preview)
   - `exp://127.0.0.1:8081/--/auth-callback` (for local development)

---

## 2. Implementation Logic

### Sending a Magic Link
To sign a user in using only their email (Magic Link/OTP via Email), use the `signInWithOtp` method:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    // This should match one of your Redirect URLs in Supabase
    emailRedirectTo: 'xum://auth-callback',
  },
})
```

### Verifying an OTP Code
If you prefer a 6-digit code (OTP) instead of a link, use the `verifyOtp` method:

```typescript
const { error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',
  type: 'magiclink' // or 'signup' depending on context
})
```

---

## 3. Deep Linking Setup (Expo)

To handle the return from a Magic Link, ensure your `app.json` has the correct scheme:

```json
{
  "expo": {
    "scheme": "xum"
  }
}
```

In your `App.tsx` or a dedicated listener, capture the URL:

```typescript
import * as Linking from 'expo-linking';

useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    // Logic to parse the URL and handle session
  };
  
  const subscription = Linking.addEventListener('url', handleDeepLink);
  return () => subscription.remove();
}, []);
```

---

## 4. Security Best Practices

1. **Row Level Security (RLS)**: Always enable RLS on your tables. The `auth.uid()` function in Postgres allows you to restrict data only to the owner.
2. **Rate Limiting**: Supabase has built-in protection, but be mindful of costs if sending thousands of emails.
3. **Site URL**: Ensure your "Site URL" in Supabase settings is set to your primary production domain or your app's deep link base.
