/**
 * Clerk Authentication Provider
 * 
 * This wraps the app with Clerk authentication.
 * Following the official Clerk Expo documentation.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClerkProvider as ClerkProviderBase, useUser, useAuth, useClerk, useSignIn, useSignUp, SignedIn, SignedOut } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const tokenCache = {
    async getToken(key: string) {
        try {
            return SecureStore.getItemAsync(key);
        } catch (err) {
            return null;
        }
    },
    async saveToken(key: string, value: string) {
        try {
            return SecureStore.setItemAsync(key, value);
        } catch (err) {
            return;
        }
    },
};
import { isSupabaseConfigured, setSupabaseAccessTokenProvider } from '../supabaseClient';

// Get the publishable key from environment
const getClerkPublishableKey = (): string => {
    // 1. Try Expo/Metro environment (Primary for React Native)
    if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        return process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    }

    // 2. Try app.json > extra (fallback for EAS builds where .env is excluded)
    const extraKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (extraKey) {
        return extraKey;
    }

    // 3. Try Vite environment (Fallback for potential pure web builds)
    try {
        const env = (process as any).env || {};
        if (env.VITE_CLERK_PUBLISHABLE_KEY) return env.VITE_CLERK_PUBLISHABLE_KEY;
    } catch (e) { }

    console.warn('[Clerk] No publishable key found in environment. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
    return '';
};

const publishableKey = getClerkPublishableKey();

/**
 * Connect Clerk's native session token to Supabase.
 * Supabase's native Clerk integration accepts Clerk's session token directly;
 * the deprecated JWT-template/session bridge must not be used here.
 */
const ClerkSupabaseSession: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { getToken, isLoaded: isAuthLoaded } = useAuth();

    useEffect(() => {
        if (!isAuthLoaded || !isSupabaseConfigured) return;

        setSupabaseAccessTokenProvider(async () => getToken() ?? null);
        return () => setSupabaseAccessTokenProvider(null);
    }, [getToken, isAuthLoaded]);

    return <>{children}</>;
};

/**
 * User provisioning belongs to a trusted Clerk webhook.
 *
 * The current SQL bootstrap still models public.users.id as a Supabase Auth
 * UUID, while native Clerk tokens expose a string sub claim. A browser-side
 * upsert would therefore fail and could make the UI report a false-ready
 * account. Keep this diagnostic until the canonical identity migration is
 * deployed and verified against the production database.
 */
const ClerkSupabaseSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (!isLoaded || !user) return;
        if (!isSupabaseConfigured) {
            console.warn('[ClerkSync] Supabase not configured – skipping user sync');
            return;
        }

        console.warn(
            '[ClerkSync] Account provisioning is waiting for the deployed Clerk identity migration. '
            + `Clerk user ${user.id} must map to the canonical database identity before data writes are enabled.`
        );
    }, [user, isLoaded]);

    return <>{children}</>;
};

/**
 * Error fallback when Clerk key is missing.
 * Shows a visible error instead of silently crashing from missing context.
 */
const ClerkMissingKeyFallback: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.error('[Clerk] Missing publishable key! Auth will not work. Check app.json extra or .env');
    return (
        <View style={missingKeyStyles.container}>
            <Text style={missingKeyStyles.emoji}>⚠️</Text>
            <Text style={missingKeyStyles.title}>Configuration Error</Text>
            <Text style={missingKeyStyles.message}>
                Authentication is not configured. Please check your environment variables and rebuild.
            </Text>
        </View>
    );
};

const missingKeyStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0d1d', justifyContent: 'center', alignItems: 'center', padding: 32 },
    emoji: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
    message: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22 },
});

/**
 * Main Clerk Provider component
 * Uses the token cache from @clerk/clerk-expo/token-cache as recommended
 */
export const ClerkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!publishableKey) {
        // Render a visible error instead of bare children (which crashes useUser/useClerk hooks)
        return <ClerkMissingKeyFallback>{children}</ClerkMissingKeyFallback>;
    }

    return (
        <ClerkProviderBase publishableKey={publishableKey} tokenCache={tokenCache}>
            <ClerkSupabaseSession>
                <ClerkSupabaseSync>
                    {children}
                </ClerkSupabaseSync>
            </ClerkSupabaseSession>
        </ClerkProviderBase>
    );
};

// Re-export Clerk hooks and components for convenience
export { useUser, useAuth, useClerk, useSignIn, useSignUp, SignedIn, SignedOut };
