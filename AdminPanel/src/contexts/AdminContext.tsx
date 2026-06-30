import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface AdminContextType {
    admin: any;
    isAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [admin, setAdmin] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            checkAdminStatus(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkAdminStatus(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdminStatus = async (user: any) => {
        if (!user) {
            setAdmin(null);
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (data && data.role === 'admin') {
            setAdmin(user);
            setIsAdmin(true);
        } else {
            setAdmin(null);
            setIsAdmin(false);
        }
        setLoading(false);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
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
