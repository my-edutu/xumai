import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

/**
 * Service to handle user profile updates and preference management.
 */

type AccountCleanupTarget = {
    table: string;
    column: string;
};

const ACCOUNT_CLEANUP_TARGETS: AccountCleanupTarget[] = [
    { table: 'user_payment_methods', column: 'user_id' },
    { table: 'push_tokens', column: 'user_id' },
    { table: 'notifications', column: 'user_id' },
    { table: 'user_notification_preferences', column: 'user_id' },
    { table: 'profiles', column: 'user_id' },
    { table: 'submissions', column: 'user_id' },
    { table: 'lexicon_submissions', column: 'user_id' },
    { table: 'rlhf_submissions', column: 'user_id' },
    { table: 'validation_votes', column: 'user_id' },
    { table: 'submission_validations', column: 'validator_id' },
    { table: 'transactions', column: 'user_id' },
    { table: 'duplicate_hashes', column: 'user_id' },
    { table: 'users', column: 'id' },
];

async function deleteRowsForUser(userId: string): Promise<boolean> {
    for (const target of ACCOUNT_CLEANUP_TARGETS) {
        const { error } = await supabase
            .from(target.table)
            .delete()
            .eq(target.column, userId);

        if (error) {
            console.warn(`[UserService] Error deleting from ${target.table}:`, error);
            if (target.table === 'users') {
                return false;
            }
        }
    }

    return true;
}

export const UserService = {

    /**
     * Update user's preferred languages.
     * @param userId Clark user ID (from useUser())
     * @param languages Array of language codes or names (e.g., ['en', 'fr'])
     */
    async updateLanguages(userId: string, languages: string[]): Promise<boolean> {
        try {
            console.log('[UserService] Updating languages for:', userId, languages);

            // Update local users table (synced with Clerk)
            const { error } = await supabase
                .from('users')
                .update({
                    languages: languages,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                console.error('[UserService] Error updating languages:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('[UserService] Exception updating languages:', error);
            return false;
        }
    },

    /**
     * Update user's interested tasks.
     * @param userId Clark user ID
     * @param interests Array of interest IDs (e.g., ['voice', 'image'])
     */
    async updateInterests(userId: string, interests: string[]): Promise<boolean> {
        try {
            console.log('[UserService] Updating interests for:', userId, interests);

            const { error } = await supabase
                .from('users')
                .update({
                    interests: interests,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                console.error('[UserService] Error updating interests:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('[UserService] Exception updating interests:', error);
            return false;
        }
    },

    /**
     * Get user profile including preferences.
     */
    async getUserProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[UserService] Error fetching profile:', error);
            return null;
        }
    },

    /**
     * Get user's saved payment details.
     */
    async getPaymentDetails(userId: string) {
        try {
            const { data, error } = await supabase
                .from('user_payment_methods')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.warn('[UserService] Error fetching payment details:', error);
            return [];
        }
    },

    /**
     * Save a new payment method.
     */
    async savePaymentDetails(userId: string, details: any): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('user_payment_methods')
                .insert({
                    user_id: userId,
                    ...details,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[UserService] Error saving payment details:', error);
            return false;
        }
    },

    /**
     * Delete user account and all associated data.
     * Auth identity deletion is handled separately by Clerk in the settings flow.
     */
    async deleteAccount(userId: string): Promise<boolean> {
        try {
            if (!supabase) {
                console.warn('[UserService] Supabase client not initialized');
                return false;
            }

            return await deleteRowsForUser(userId);
        } catch (error) {
            console.error('[UserService] Error deleting account:', error);
            return false;
        }
    }
};
