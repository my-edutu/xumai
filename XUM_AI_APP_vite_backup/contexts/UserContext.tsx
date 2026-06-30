import React, { createContext, useContext, useState } from 'react';

// PROTOTYPE MODE: Mocked user context - no Supabase required
// TODO: Restore Supabase integration before production

interface UserProfile {
    balance: number;
    level: number;
    current_xp: number;
    target_xp: number;
    role: string;
    full_name: string;
}

interface UserContextType {
    user: any;
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Demo profile data for prototyping
const DEMO_PROFILE: UserProfile = {
    balance: 247.50,
    level: 12,
    current_xp: 2450,
    target_xp: 3000,
    role: 'contributor',
    full_name: 'Demo User'
};

const DEMO_USER = {
    id: 'demo-user-001',
    email: 'demo@xum.ai'
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // PROTOTYPE: Always provide a demo user
    const [user] = useState<any>(DEMO_USER);
    const [profile] = useState<UserProfile | null>(DEMO_PROFILE);
    const [loading] = useState(false);

    const refreshProfile = async () => {
        // No-op in prototype mode
        console.log('[Prototype] Profile refresh simulated');
    };

    const signOut = async () => {
        // No-op in prototype mode
        console.log('[Prototype] Sign out simulated');
    };

    return (
        <UserContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

