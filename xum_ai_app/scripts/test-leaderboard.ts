
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeaderboard() {
    console.log('Testing leaderboard query...');
    const { data, error } = await supabase
        .from('user_leaderboard')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error querying user_leaderboard:', error);
    } else {
        console.log('Success! Data:', data);
    }
}

testLeaderboard();
