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
import { supabase, isSupabaseConfigured } from '../supabaseClient';

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
 * Component to sync Clerk auth state with Supabase session
 * This injects the Clerk JWT into Supabase for RLS verification
 */
const ClerkSupabaseSession: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();

    useEffect(() => {
        if (!isAuthLoaded || !isSupabaseConfigured) return;

        const syncSession = async () => {
            try {
                if (userId) {
                    // 1. Get token from Clerk using the 'supabase' template
                    // Note: You must create this template in Clerk Dashboard > JWT Templates
                    const token = await getToken({ template: 'supabase' });
                    
                    if (token) {
                        const { error } = await supabase.auth.setSession({
                            access_token: token,
                            refresh_token: '', // Clerk handles token refreshing
                        });
                        
                        if (error) {
                            console.warn('[ClerkSession] Supabase session error:', error.message);
                        } else {
                            console.log('[ClerkSession] Supabase session active for:', userId);
                        }
                    }
                } else {
                    // 2. No user - clear Supabase session
                    await supabase.auth.signOut();
                    console.log('[ClerkSession] Supabase session cleared');
                }
            } catch (err: any) {
                console.warn('[ClerkSession] Session sync failed:', err.message);
            }
        };

        syncSession();
    }, [userId, isAuthLoaded]);

    return <>{children}</>;
};

/**
 * Component to sync Clerk user to Supabase
 * This ensures the user exists in Supabase's users table
 */
const ClerkSupabaseSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (!isLoaded || !user) return;
        if (!isSupabaseConfigured) {
            console.warn('[ClerkSync] Supabase not configured – skipping user sync');
            return;
        }

        const syncUserToSupabase = async () => {
            try {
                const email = user.primaryEmailAddress?.emailAddress || '';
                const userData = {
                    id: user.id,
                    email,
                    full_name: user.fullName || user.firstName || 'Contributor',
                    avatar_url: user.imageUrl || null,
                    updated_at: new Date().toISOString(),
                };

                // Check if user already exists by email (handles Clerk ID changes)
                const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle();

                if (existing && existing.id !== user.id) {
                    // Update existing record's Clerk ID and other fields
                    const { error } = await supabase
                        .from('users')
                        .update({ ...userData, id: user.id })
                        .eq('email', email);
                    if (error) {
                        console.warn('[ClerkSync] Error updating existing user:', error.message);
                    } else {
                        console.log('[ClerkSync] Updated existing user with new Clerk ID:', user.id);
                    }
                } else {
                    // Upsert normally by ID
                    const { error } = await supabase.from('users').upsert(userData, { onConflict: 'id' });
                    if (error) {
                        console.warn('[ClerkSync] Error syncing user to Supabase:', error.message);
                    } else {
                        console.log('[ClerkSync] User synced to Supabase:', user.id);
                    }
                }
            } catch (err: any) {
                console.warn('[ClerkSync] Network error:', err.message);
            }
        };

        syncUserToSupabase();
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
