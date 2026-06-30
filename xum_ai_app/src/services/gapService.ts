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

/**
 * Mock Service to simulate the "Data Gap Engine"
 * In production, this would query an analytics DB or run a background ML job.
 */
export const GapService = {

    /**
     * Run a "Gap Analysis" to find missing data
     */
    detectGaps: async (): Promise<DataGap[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return [
            {
                id: 'gap_01',
                title: 'Medical Terms in Hausa',
                description: 'Model hallucinates when translating medical instructions to Hausa.',
                region: 'Kano, Nigeria',
                severity: 'critical',
                coverage_percentage: 12,
                recommended_action: {
                    type: 'voice',
                    prompt_context: 'Hausa Medical Terminology'
                }
            },
            {
                id: 'gap_02',
                title: 'Street Signs at Night',
                description: 'Computer Vision model fails to detect signs in low-light conditions.',
                region: 'Lagos, Nigeria',
                severity: 'high',
                coverage_percentage: 35,
                recommended_action: {
                    type: 'image',
                    prompt_context: 'Street Signs (Night/Low Light)'
                }
            },
            {
                id: 'gap_03',
                title: 'Pidgin Slang 2024',
                description: 'New slang terms from social media are missing from the training set.',
                region: 'Online / Social',
                severity: 'medium',
                coverage_percentage: 55,
                recommended_action: {
                    type: 'text',
                    prompt_context: 'Trending Pidgin Slang'
                }
            },
            {
                id: 'gap_04',
                title: 'Rural Market Sounds',
                description: 'Audio model struggles to separate speech from market noise.',
                region: 'Onitsha, Nigeria',
                severity: 'low',
                coverage_percentage: 78,
                recommended_action: {
                    type: 'video',
                    prompt_context: 'Busy Market Interactions'
                }
            }
        ];
    }
};
