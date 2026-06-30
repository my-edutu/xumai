/**
 * Supabase Configuration Verification Script
 * 
 * Verifies that:
 * 1. Supabase credentials are configured
 * 2. Database connection is working
 * 3. Storage buckets are accessible
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONSTANTS
// ============================================================================

const REQUIRED_BUCKETS = ['voice-recordings', 'image-captures', 'video-recordings'];
const PROJECT_NAME = 'xum ai';

// ============================================================================
// CONFIGURATION
// ============================================================================

const getSupabaseUrl = (): string => {
    return process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        '';
};

const getSupabaseAnonKey = (): string => {
    return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        '';
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();

    if (!url || url.includes('placeholder')) {
        errors.push('❌ SUPABASE_URL is missing or invalid');
    }

    if (!key || key.length < 20 || key.includes('placeholder')) {
        errors.push('❌ SUPABASE_ANON_KEY is missing or invalid');
    }

    // Extract project reference from URL
    if (url) {
        try {
            const projectRef = new URL(url).hostname.split('.')[0];
            console.log(`\n📍 Project Reference: ${projectRef}`);
        } catch (err) {
            errors.push('❌ SUPABASE_URL is not a valid URL');
        }
    }

    return { valid: errors.length === 0, errors };
}

async function testDatabaseConnection(supabase: any): Promise<{ success: boolean; error?: string }> {
    try {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) {
            return { success: false, error: error.message };
        }

        console.log(`✅ Database connection successful (profiles table found with ${count ?? 0} rows)`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

async function testStorageBuckets(supabase: any): Promise<{ success: boolean; found: string[]; missing: string[] }> {
    const found: string[] = [];
    const missing: string[] = [];

    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.log(`⚠️  Storage API call failed: ${error.message}`);
            return { success: false, found: [], missing: REQUIRED_BUCKETS };
        }

        const bucketNames = (buckets || []).map((b: any) => b.name);

        for (const requiredBucket of REQUIRED_BUCKETS) {
            if (bucketNames.includes(requiredBucket)) {
                found.push(requiredBucket);
                console.log(`✅ Bucket '${requiredBucket}' exists`);
            } else {
                missing.push(requiredBucket);
                console.log(`❌ Bucket '${requiredBucket}' is MISSING`);
            }
        }

        return { success: missing.length === 0, found, missing };
    } catch (err: any) {
        console.log(`⚠️  Storage check failed: ${err.message}`);
        return { success: false, found: [], missing: REQUIRED_BUCKETS };
    }
}

async function testRPCFunctions(supabase: any): Promise<void> {
    try {
        const { data, error } = await supabase.rpc('get_user_balance', { p_user_id: 'test-user-id' });

        if (error && !error.message.includes('function') && !error.message.includes('does not exist')) {
            console.log(`✅ RPC functions are callable (test returned expected error)`);
        } else if (!error) {
            console.log(`✅ RPC function 'get_user_balance' executed successfully`);
        } else {
            console.log(`⚠️  RPC function 'get_user_balance' may not exist: ${error.message}`);
        }
    } catch (err: any) {
        console.log(`⚠️  RPC test failed: ${err.message}`);
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log('\n🔍 XUM AI Supabase Configuration Verification\n');
    console.log('━'.repeat(60));

    // Step 1: Validate Credentials
    console.log('\n📋 Step 1: Validating Credentials');
    const credCheck = validateCredentials();

    if (!credCheck.valid) {
        console.log('\n❌ CONFIGURATION ERRORS:');
        credCheck.errors.forEach(err => console.log(`   ${err}`));
        console.log('\n💡 Please check your .env file and ensure:');
        console.log('   - EXPO_PUBLIC_SUPABASE_URL is set');
        console.log('   - EXPO_PUBLIC_SUPABASE_ANON_KEY is set');
        process.exit(1);
    }

    console.log('✅ Credentials found and valid\n');

    // Step 2: Initialize Client
    console.log('📋 Step 2: Initializing Supabase Client');
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
    console.log('✅ Client initialized\n');

    // Step 3: Test Database Connection
    console.log('📋 Step 3: Testing Database Connection');
    const dbTest = await testDatabaseConnection(supabase);

    if (!dbTest.success) {
        console.log(`❌ Database connection failed: ${dbTest.error}`);
        console.log('\n💡 Possible issues:');
        console.log('   - Check if your Supabase project is active');
        console.log('   - Verify RLS policies on the profiles table');
        console.log('   - Ensure the anon key has proper permissions');
        process.exit(1);
    }

    // Step 4: Test Storage Buckets
    console.log('\n📋 Step 4: Checking Storage Buckets');
    const storageTest = await testStorageBuckets(supabase);

    if (!storageTest.success) {
        console.log('\n⚠️  STORAGE CONFIGURATION INCOMPLETE');
        console.log(`   Missing buckets: ${storageTest.missing.join(', ')}`);
        console.log('\n💡 Create missing buckets in Supabase Dashboard:');
        console.log('   1. Go to Storage section');
        console.log('   2. Create each missing bucket');
        console.log('   3. Set appropriate public/private access policies');
    }

    // Step 5: Test RPC Functions
    console.log('\n📋 Step 5: Testing RPC Functions');
    await testRPCFunctions(supabase);

    // Summary
    console.log('\n━'.repeat(60));
    console.log('\n✨ Verification Summary:');
    console.log(`   ✅ Credentials: Valid`);
    console.log(`   ✅ Database: Connected`);
    console.log(`   ${storageTest.success ? '✅' : '⚠️ '} Storage: ${storageTest.found.length}/${REQUIRED_BUCKETS.length} buckets found`);
    console.log('\n━'.repeat(60));

    if (storageTest.success) {
        console.log('\n🎉 All checks passed! Your Supabase backend is ready.\n');
    } else {
        console.log('\n⚠️  Some issues detected. Please review the output above.\n');
        process.exit(1);
    }
}

// Run the verification
main().catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
