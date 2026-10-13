import { supabase } from '../supabaseClient';

/**
 * Backward-compatible status shape while older UI references are migrated.
 * Followers are NOT qualification evidence and are always zero in this adapter.
 * Monetary authorization must NEVER rely on this client-side object.
 */
export interface MonetizationStatus {
    isEligible: boolean;
    currentFollowers: number;
    targetFollowers: number;
    percentage: number;
    canApply: boolean;
    description: string;
    status: 'not_monetized' | 'eligible';
    reason: string;
    canWithdraw: false;
}

interface RestrictedSnapshot {
    status?: string;
    reason?: string;
    program_available?: boolean;
    can_withdraw?: boolean;
}

const unavailable = (reason: string, description: string): MonetizationStatus => ({
    isEligible: false,
    currentFollowers: 0,
    targetFollowers: 0,
    percentage: 0,
    canApply: false,
    status: 'not_monetized',
    reason,
    canWithdraw: false,
    description,
});

/**
 * Read-only; no arbitrary userId is forwarded to the server.
 * Supabase authenticates the Clerk JWT and resolves its own `sub`.
 * Missing migration or invalid identity is a fail-closed result.
 */
export const MonetizationThresholdService = {
    /** @deprecated Follower thresholds must never unlock earnings. */
    async getGlobalTargetFollowers(): Promise<number> {
        return 0;
    },

    async checkMonetizationEligibility(userId: string): Promise<boolean> {
        const snapshot = await this.getMonetizationStatus(userId);
        return snapshot.isEligible;
    },

    async getMonetizationStatus(_userId: string): Promise<MonetizationStatus> {
        try {
            const { data, error } = await supabase.rpc('get_my_monetization_status_v1');
            if (error) {
                console.warn('[Monetization] Read-only status not ready:', error.message);
                return unavailable('SERVICE_UNAVAILABLE', 'Monetization eligibility is not available yet.');
            }
            const snapshot = (data ?? {}) as RestrictedSnapshot;
            const enabled = snapshot.program_available === true;
            const qualified = enabled && snapshot.status === 'eligible';

            return {
                status: qualified ? 'eligible' : 'not_monetized',
                reason: snapshot.reason || 'ASSESSMENT_PENDING',
                isEligible: qualified,
                // The application/review API is not deployed yet.
                canApply: false,
                canWithdraw: false,
                currentFollowers: 0,
                targetFollowers: 0,
                percentage: 0, // No fabricated percentage from old follower count.
                description: !enabled
                    ? 'The XUM Monetization Program is not open yet.'
                    : qualified
                        ? 'Qualification reviewed. Monetization activation is a separate approval.'
                        : 'Complete your verified qualifications to become eligible.',
            };
        } catch (error) {
            console.warn('[Monetization] Could not fetch eligibility:', error);
            return unavailable('SERVICE_UNAVAILABLE', 'Monetization eligibility is not available yet.');
        }
    },
};
