#!/bin/bash
# ============================================================
# XUM AI — EAS Secrets Setup Script
# Run this ONCE to push all production secrets to EAS
# Make sure you are logged in: eas login
# ============================================================

echo "🔐 Setting up EAS Secrets for XUM AI production..."

# ── Supabase ────────────────────────────────────────────────
eas secret:create --scope project \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://gkhemshbwmealgxczykk.supabase.co" \
  --force

eas secret:create --scope project \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "YOUR_SUPABASE_ANON_KEY_HERE" \
  --force

# ── Clerk (MUST be pk_live_* for production) ────────────────
eas secret:create --scope project \
  --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --value "pk_live_YOUR_PRODUCTION_KEY_HERE" \
  --force

# ── Resend ──────────────────────────────────────────────────
eas secret:create --scope project \
  --name EXPO_PUBLIC_RESEND_API_KEY \
  --value "YOUR_RESEND_API_KEY_HERE" \
  --force

# ── Android Keystore (for release signing) ──────────────────
# First generate or export your keystore, then:
eas secret:create --scope project \
  --name ANDROID_KEYSTORE_PASSWORD \
  --value "YOUR_KEYSTORE_PASSWORD_HERE" \
  --force

eas secret:create --scope project \
  --name ANDROID_KEY_ALIAS \
  --value "YOUR_KEY_ALIAS_HERE" \
  --force

eas secret:create --scope project \
  --name ANDROID_KEY_PASSWORD \
  --value "YOUR_KEY_PASSWORD_HERE" \
  --force

echo ""
echo "✅ EAS Secrets configured!"
echo ""
echo "⚠️  IMPORTANT: Replace all YOUR_*_HERE placeholders above with real values before running!"
echo "   Get your Clerk LIVE key from: https://dashboard.clerk.com → API Keys → Production"
echo "   Generate Android keystore: keytool -genkey -v -keystore release.keystore -alias xumai -keyalg RSA -keysize 2048 -validity 10000"
