import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { User, UserProfile } from '../types';

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface UserContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isPrototypeMode: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ============================================================================
// DEMO DATA (Prototype Mode Only)
// ============================================================================

const DEMO_PROFILE: UserProfile = {
    id: 'demo-profile-001',
    user_id: 'demo-user-001',
    balance: 247.5,
    level: 12,
    current_xp: 2450,
    target_xp: 3000,
    role: 'contributor',
    full_name: 'Demo User',
    precision_score: 98.4,
    total_tasks_completed: 142,
};

const DEMO_USER: User = {
    id: 'demo-user-001',
    email: 'demo@xum.ai',
};

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Determines if the app should run in prototype mode.
 * Prototype mode uses mock data instead of real Supabase calls.
 */
const isPrototypeModeEnabled = (): boolean => {
    // Check if Supabase is properly configured
    // Use process.env (Metro inlines EXPO_PUBLIC_* at bundle time)
    // NOTE: import.meta.env is NOT supported by Hermes and will crash in production
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    return !supabaseUrl || supabaseUrl.includes('placeholder');
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isPrototypeMode = isPrototypeModeEnabled();

    const [user, setUser] = useState<User | null>(isPrototypeMode ? DEMO_USER : null);
    const [profile, setProfile] = useState<UserProfile | null>(isPrototypeMode ? DEMO_PROFILE : null);
    const [loading, setLoading] = useState(!isPrototypeMode);

    // Fetch profile from Supabase
    const fetchProfile = async (userId: string): Promise<void> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('[UserContext] Profile fetch error:', error.message);
                return;
            }

            if (data) {
                setProfile({
                    id: data.id,
                    user_id: data.user_id,
                    full_name: data.full_name || 'Anonymous',
                    balance: data.balance || 0,
                    level: data.level || 1,
                    current_xp: data.current_xp || 0,
                    target_xp: data.target_xp || 1000,
                    role: data.role || 'contributor',
                    precision_score: data.precision_score,
                    total_tasks_completed: data.total_tasks_completed,
                });
            }
        } catch (err) {
            console.error('[UserContext] Unexpected error fetching profile:', err);
        }
    };

    // Initialize auth state
    useEffect(() => {
        if (isPrototypeMode) {
            console.log('[UserContext] Running in PROTOTYPE mode with mock data');
            return;
        }

        const initAuth = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                    });
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error('[UserContext] Auth initialization error:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                });
                await fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [isPrototypeMode]);

    const refreshProfile = async (): Promise<void> => {
        if (isPrototypeMode) {
            console.log('[UserContext] Profile refresh simulated (prototype mode)');
            return;
        }

        if (user?.id) {
            await fetchProfile(user.id);
        }
    };

    const signOut = async (): Promise<void> => {
        if (isPrototypeMode) {
            console.log('[UserContext] Sign out simulated (prototype mode)');
            setUser(null);
            setProfile(null);
            return;
        }

        try {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
        } catch (err) {
            console.error('[UserContext] Sign out error:', err);
        }
    };

    return (
        <UserContext.Provider value={{ user, profile, loading, isPrototypeMode, refreshProfile, signOut }}>
            {children}
        </UserContext.Provider>
    );
};

// ============================================================================
// HOOK
// ============================================================================

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
