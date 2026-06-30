
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

export interface MonetizationStatus {
    isEligible: boolean;
    currentFollowers: number;
    targetFollowers: number;
    percentage: number;
    canApply: boolean;
    description: string;
}

export const MonetizationThresholdService = {
    /**
     * Get the global monetization target followers from platform settings.
     * Default is 1000 if not set.
     */
    async getGlobalTargetFollowers(): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'monetization_target_followers')
                .single();

            if (error || !data) {
                // Return default fallback if setting not found
                return 1000;
            }

            // Ensure we handle numeric value correctly
            return Number(data.value) || 1000;
        } catch (error) {
            console.error('[MonetizationThresholdService] Error fetching target:', error);
            return 1000;
        }
    },

    /**
     * Check if a user meets the monetization eligibility criteria.
     * Checks followers count against the global target.
     */
    async checkMonetizationEligibility(userId: string): Promise<boolean> {
        try {
            const status = await this.getMonetizationStatus(userId);
            return status.isEligible;
        } catch (error) {
            console.error('[MonetizationThresholdService] Error checking eligibility:', error);
            return false;
        }
    },

    /**
     * Get detailed monetization status for a user.
     * Returns current progress towards the target.
     */
    async getMonetizationStatus(userId: string): Promise<MonetizationStatus> {
        try {
            // 1. Fetch user's follower count
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('followers_count')
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            // 2. Fetch global target
            const target = await this.getGlobalTargetFollowers();
            const current = userData?.followers_count || 0;

            // Calculate percentage (0 to 100)
            const percentage = Math.min(100, Math.max(0, (current / target) * 100));
            const isEligible = current >= target;

            return {
                isEligible,
                currentFollowers: current,
                targetFollowers: target,
                percentage,
                canApply: isEligible, // Could add more conditions here (e.g. account age, trust score)
                description: isEligible
                    ? 'You are eligible for monetization!'
                    : `Get ${target - current} more followers to unlock monetization.`
            };
        } catch (error) {
            console.error('[MonetizationThresholdService] Error getting status:', error);
            return {
                isEligible: false,
                currentFollowers: 0,
                targetFollowers: 1000,
                percentage: 0,
                canApply: false,
                description: 'Unable to check status.'
            };
        }
    }
};
