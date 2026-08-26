import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const required = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
] as const;

const missing = required.filter((name) => {
    const value = process.env[name];
    return !value || value.includes('placeholder');
});

if (missing.length > 0) {
    console.error(`Missing production web environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

try {
    const url = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL!);
    if (url.protocol !== 'https:') throw new Error('Supabase URL must use HTTPS');
} catch {
    console.error('EXPO_PUBLIC_SUPABASE_URL must be a valid HTTPS URL');
    process.exit(1);
}

console.log('Web production environment is configured.');
