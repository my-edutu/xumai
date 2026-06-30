import { supabase } from '../supabaseClient';

export interface DashboardStats {
    total_contributors: number;
    active_contributors_today: number;
    total_validated_samples: number;
    avg_consensus_score: number;
    total_revenue_mtd: number;
    pending_payouts: number;
    pending_payout_count: number;
    active_projects: number;
    active_api_keys: number;
}

export interface ConsensusTrend {
    date: string;
    total_submissions: number;
    verified_count: number;
    avg_consensus_pct: number;
    verification_rate: number;
}

export interface TopContributor {
    user_id: string;
    full_name: string;
    xp: number;
    trust_score: number;
    total_earnings: number;
    total_submissions: number;
    accuracy_pct: number;
}

export interface LanguagePurity {
    language: string;
    total_samples: number;
    purity_score: number;
    verified_samples: number;
}

export interface ValidationQueueItem {
    project_name: string;
    project_id: string;
    pending_count: number;
    avg_wait_hours: number;
}

export interface MonthlyFinancials {
    month: string;
    revenue: number;
    payouts: number;
    net_profit: number;
}

export const analyticsService = {
    /**
     * Fetch aggregated dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats | null> {
        try {
            const { data, error } = await supabase.rpc('get_dashboard_stats');
            if (error) throw error;
            return data as DashboardStats;
        } catch (e) {
            console.error('Failed to fetch dashboard stats:', e);
            return null;
        }
    },

    /**
     * Fetch consensus trend over time
     */
    async getConsensusTrend(days: number = 30): Promise<ConsensusTrend[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_consensus_trend')
                .select('*')
                .limit(days);

            if (error) throw error;
            return (data || []) as ConsensusTrend[];
        } catch (e) {
            console.error('Failed to fetch consensus trend:', e);
            return [];
        }
    },

    /**
     * Fetch top contributors leaderboard
     */
    async getTopContributors(limit: number = 10): Promise<TopContributor[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_top_contributors')
                .select('*')
                .limit(limit);

            if (error) throw error;
            return (data || []) as TopContributor[];
        } catch (e) {
            console.error('Failed to fetch top contributors:', e);
            return [];
        }
    },

    /**
     * Fetch language purity breakdown
     */
    async getLanguagePurity(): Promise<LanguagePurity[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_language_purity')
                .select('*')
                .limit(10);

            if (error) throw error;
            return (data || []) as LanguagePurity[];
        } catch (e) {
            console.error('Failed to fetch language purity:', e);
            return [];
        }
    },

    /**
     * Fetch validation queue
     */
    async getValidationQueue(): Promise<ValidationQueueItem[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_validation_queue')
                .select('*')
                .limit(10);

            if (error) throw error;
            return (data || []) as ValidationQueueItem[];
        } catch (e) {
            console.error('Failed to fetch validation queue:', e);
            return [];
        }
    },

    /**
     * Fetch monthly financials
     */
    async getMonthlyFinancials(months: number = 6): Promise<MonthlyFinancials[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_monthly_financials')
                .select('*')
                .limit(months);

            if (error) throw error;
            return (data || []) as MonthlyFinancials[];
        } catch (e) {
            console.error('Failed to fetch monthly financials:', e);
            return [];
        }
    },

    /**
     * Fetch quality distribution
     */
    async getQualityDistribution(): Promise<{ status: string; count: number; percentage: number }[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_quality_distribution')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Failed to fetch quality distribution:', e);
            return [];
        }
    },

    /**
     * Fetch recent activity feed
     */
    async getRecentActivity(): Promise<{ event_type: string; message: string; created_at: string; user_id: string }[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_recent_activity')
                .select('*')
                .limit(20);

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Failed to fetch recent activity:', e);
            return [];
        }
    }
};

export default analyticsService;
