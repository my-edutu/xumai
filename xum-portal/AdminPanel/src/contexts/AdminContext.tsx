import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '../supabaseClient';

interface AdminContextType {
    admin: any;
    isAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoaded } = useUser();
    const { signOut: clerkSignOut } = useClerk();
    const [admin, setAdmin] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) {
            setLoading(true);
            return;
        }

        if (!user) {
            setAdmin(null);
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        checkAdminStatus(user);
    }, [user, isLoaded]);

    const checkAdminStatus = async (clerkUser: any) => {
        const email = clerkUser.primaryEmailAddress?.emailAddress;
        if (!email) {
            setAdmin(null);
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        // 1. Hardcoded Master Admins
        const MASTER_ADMINS = ['info@xumai.app', 'infoafrichainx@gmail.com'];
        if (email && MASTER_ADMINS.includes(email)) {
            setAdmin(clerkUser);
            setIsAdmin(true);
            setLoading(false);
            return;
        }

        // 2. Clerk Metadata (Clerk-native way)
        if (clerkUser.publicMetadata?.role === 'admin') {
            setAdmin(clerkUser);
            setIsAdmin(true);
            setLoading(false);
            return;
        }

        // 3. Supabase fallback
        const { data } = await supabase
            .from('users')
            .select('role')
            .eq('email', email)
            .maybeSingle();

        if (data && data.role === 'admin') {
            setAdmin(clerkUser);
            setIsAdmin(true);
        } else {
            setAdmin(clerkUser);
            setIsAdmin(false);
        }
        setLoading(false);
    };

    const signOut = async () => {
        await clerkSignOut();
    };

    return (
        <AdminContext.Provider value={{ admin, isAdmin, loading, signOut }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
