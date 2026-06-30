import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Robust URL validation to prevent crashes during initialization
const getValidUrl = (url: any): string => {
    if (typeof url !== 'string' || !url.startsWith('http')) {
        return 'https://placeholder.supabase.co';
    }
    try {
        new URL(url);
        return url;
    } catch {
        return 'https://placeholder.supabase.co';
    }
};

const finalUrl = getValidUrl(supabaseUrl);
const finalKey = (typeof supabaseAnonKey === 'string' && supabaseAnonKey) || 'placeholder-key';

if (finalUrl.includes('placeholder')) {
    console.warn('Company Portal: Supabase credentials missing or invalid.');
}

export const supabase = createClient(finalUrl, finalKey);
