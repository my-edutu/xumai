import { supabase } from '../supabaseClient';
import { Transaction, LeaderboardEntry } from './types';
import { isValidOtp } from './otp';

// Helper to check Supabase config without duplicating the whole guard
const ensureSupabase = (context: string) => {
    if (!supabase) {
        console.warn(`[${context}] Supabase client not initialized`);
        return false;
    }
    return true;
};

/**
 * Get transaction history for user
 */
export async function getTransactionHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
): Promise<Transaction[]> {
    if (!ensureSupabase('Wallet')) return [];
    try {
        const { data, error } = await supabase.rpc('get_transaction_history', {
            p_user_id: userId,
            p_limit: limit,
            p_offset: offset,
        });

        if (error) {
            console.warn('[Wallet] RPC error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[Wallet] Network error:', err.message);
        return [];
    }
}

/**
 * Get current balance for user
 */
export async function getUserBalance(userId: string): Promise<number> {
    if (!ensureSupabase('Balance')) return 0;
    try {
        const { data, error } = await supabase.rpc('get_user_balance', {
            p_user_id: userId,
        });

        if (error) {
            console.warn('[Balance] RPC error:', error.message);
            return 0;
        }

        return data || 0;
    } catch (err: any) {
        console.warn('[Balance] Network error:', err.message);
        return 0;
    }
}

/**
 * Request a withdrawal
 */
export async function requestWithdrawal(
    userId: string,
    amount: number,
    method: string,
    details: any
): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!ensureSupabase('Withdraw')) return { success: false, error: 'Supabase not configured' };
    try {
        const { data, error } = await supabase.functions.invoke('request-withdrawal', {
            body: {
                amount,
                method,
                details,
            },
        });

        if (error) {
            console.warn('[Withdraw] RPC error:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (err: any) {
        console.warn('[Withdraw] Network error:', err.message);
        return { success: false, error: err.message || 'Withdrawal request failed' };
    }
}

/**
 * Verify a withdrawal challenge on the server.
 * The client never accepts a locally generated or hard-coded OTP.
 */
export async function verifyWithdrawalOtp(
    userId: string,
    withdrawalId: string,
    otp: string
): Promise<{ success: boolean; error?: string }> {
    if (!ensureSupabase('WithdrawOTP')) return { success: false, error: 'Supabase not configured' };
    if (!isValidOtp(otp)) return { success: false, error: 'Enter the six-digit verification code.' };

    try {
        const { error } = await supabase.rpc('verify_withdrawal_otp', {
            p_user_id: userId,
            p_withdrawal_id: withdrawalId,
            p_otp: otp,
        });

        if (error) {
            console.warn('[WithdrawOTP] RPC error:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.warn('[WithdrawOTP] Network error:', err.message);
        return { success: false, error: err.message || 'Verification failed' };
    }
}

/**
 * Get global leaderboard
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!ensureSupabase('Leaderboard')) return [];
    try {
        const { data, error } = await supabase
            .from('user_leaderboard')
            .select('*')
            .order('total_earned', { ascending: false })
            .limit(limit);

        if (error) {
            console.warn('[Leaderboard] Query error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[Leaderboard] Network error:', err.message);
        return [];
    }
}

/**
 * Get weekly leaderboard (current calendar week)
 */
export async function getWeeklyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!ensureSupabase('WeeklyLeaderboard')) return [];
    try {
        const { data, error } = await supabase
            .from('user_weekly_leaderboard')
            .select('*')
            .order('total_earned', { ascending: false })
            .limit(limit);

        if (error) {
            console.warn('[WeeklyLeaderboard] Query error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[WeeklyLeaderboard] Network error:', err.message);
        return [];
    }
}

/**
 * Get country leaderboard filtered by location
 */
export async function getCountryLeaderboard(country: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!ensureSupabase('CountryLeaderboard') || !country) return [];
    try {
        const { data, error } = await supabase
            .from('user_leaderboard')
            .select('*')
            .eq('country', country)
            .order('total_earned', { ascending: false })
            .limit(limit);

        if (error) {
            console.warn('[CountryLeaderboard] Query error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[CountryLeaderboard] Network error:', err.message);
        return [];
    }
}

/**
 * Get a user's global rank via RPC
 */
export async function getUserGlobalRank(userId: string): Promise<number | null> {
    if (!ensureSupabase('UserRank')) return null;
    try {
        const { data, error } = await supabase.rpc('get_user_global_rank', {
            p_user_id: userId,
        });

        if (error) {
            console.warn('[UserRank] RPC error:', error.message);
            return null;
        }

        return data ?? null;
    } catch (err: any) {
        console.warn('[UserRank] Network error:', err.message);
        return null;
    }
}

/**
 * Get user earnings for specific periods (Today, Month)
 */
export async function getUserEarningsPeriod(userId: string): Promise<{ today: number; month: number }> {
    if (!ensureSupabase('EarningsPeriod')) return { today: 0, month: 0 };
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data, error } = await supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('user_id', userId)
            .in('type', ['earn', 'bonus'])
            .gte('created_at', startOfMonth);

        if (error) throw error;

        let today = 0;
        let month = 0;

        (data || []).forEach((t: any) => {
            month += Number(t.amount);
            if (t.created_at >= startOfDay) {
                today += Number(t.amount);
            }
        });

        return { today, month };
    } catch (err: any) {
        console.warn('[EarningsPeriod] Error:', err.message);
        return { today: 0, month: 0 };
    }
}

