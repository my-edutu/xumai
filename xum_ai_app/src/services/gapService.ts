import { supabase, isSupabaseConfigured } from '../supabaseClient';

export interface DataGap {
    id: string;
    title: string;
    description: string;
    region: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    coverage_percentage: number;
    recommended_action: {
        type: 'voice' | 'image' | 'video' | 'text';
        prompt_context: string;
    };
}

const MODALITIES: Array<DataGap['recommended_action']['type']> = ['voice', 'image', 'video', 'text'];

// Coverage target: how many submissions each active prompt should ideally
// collect before a modality counts as fully covered.
const TARGET_SUBMISSIONS_PER_PROMPT = 10;

const severityFor = (coverage: number): DataGap['severity'] => {
    if (coverage < 25) return 'critical';
    if (coverage < 50) return 'high';
    if (coverage < 75) return 'medium';
    return 'low';
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Data Gap Engine — computes live coverage per modality from real data:
 * active capture_prompts vs. collected submissions.
 */
export const GapService = {

    /**
     * Run a gap analysis across all modalities.
     * Returns one entry per modality that has active prompts, ordered by
     * severity (least-covered first).
     */
    detectGaps: async (): Promise<DataGap[]> => {
        if (!isSupabaseConfigured) {
            throw new Error('Supabase not configured');
        }

        const gaps = await Promise.all(MODALITIES.map(async (modality): Promise<DataGap | null> => {
            try {
                const [promptResult, submissionResult, topPromptResult] = await Promise.all([
                    supabase
                        .from('capture_prompts')
                        .select('*', { count: 'exact', head: true })
                        .eq('task_type', modality)
                        .eq('is_active', true),
                    supabase
                        .from('submissions')
                        .select('*', { count: 'exact', head: true })
                        .filter('submission_data->>task_type', 'eq', modality),
                    supabase
                        .from('capture_prompts')
                        .select('category')
                        .eq('task_type', modality)
                        .eq('is_active', true)
                        .order('base_reward', { ascending: false })
                        .limit(1),
                ]);

                const promptCount = promptResult.count ?? 0;
                if (promptCount === 0) return null; // nothing requested for this modality

                const submissionCount = submissionResult.count ?? 0;
                const target = promptCount * TARGET_SUBMISSIONS_PER_PROMPT;
                const coverage = Math.min(100, Math.round((submissionCount / target) * 100));
                const topCategory = topPromptResult.data?.[0]?.category || 'General';

                return {
                    id: `gap_${modality}`,
                    title: `${titleCase(modality)} data coverage`,
                    description: `${submissionCount} submission${submissionCount === 1 ? '' : 's'} collected across ${promptCount} active prompt${promptCount === 1 ? '' : 's'}.`,
                    region: 'Network-wide',
                    severity: severityFor(coverage),
                    coverage_percentage: coverage,
                    recommended_action: {
                        type: modality,
                        prompt_context: topCategory,
                    },
                };
            } catch (err) {
                console.warn(`[GapService] ${modality} coverage query failed`, err);
                return null;
            }
        }));

        const results = gaps.filter((g): g is DataGap => g !== null);
        return results.sort((a, b) => a.coverage_percentage - b.coverage_percentage);
    }
};
