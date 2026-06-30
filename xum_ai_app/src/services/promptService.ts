export interface AiPrompt {
    id: string;
    text: string;
    category: string;
    type: 'voice' | 'image' | 'video' | 'text';
    difficulty: number;
    isSelected: boolean;
    source?: 'enterprise' | 'gap_engine' | 'user_capture' | 'third_party' | 'ai_generated';
}

export interface PromptGenerationParams {
    goal: string;
    context: string;
    modality: 'voice' | 'image' | 'video' | 'text';
    count: number;
}

import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getSeedPrompts } from '../data/seedPrompts';
import { TaskPrompt, TaskType } from './types';

/**
 * Service to manage AI Prompt Generation & Database Seeding
 */
export const PromptService = {

    /**
     * Generate prompts based on parameters (Mock for now, but scalable)
     */
    generateAiPrompts: async (params: PromptGenerationParams): Promise<AiPrompt[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const prompts: AiPrompt[] = [];
        const baseId = Date.now();

        for (let i = 0; i < params.count; i++) {
            prompts.push({
                id: `gen_${baseId}_${i}`,
                text: generateMockPromptText(params.modality, params.context, i),
                category: params.context || 'General',
                type: params.modality,
                difficulty: Math.floor(Math.random() * 3) + 1, // 1-3
                isSelected: true
            });
        }

        return prompts;
    },

    /**
     * Deploy selected prompts to the database
     */
    deployPrompts: async (prompts: AiPrompt[]): Promise<{ success: boolean; count: number }> => {
        if (!isSupabaseConfigured) {
            console.warn("Supabase not configured, pretending to deploy.");
            return { success: true, count: prompts.length };
        }

        const dbRecords = prompts.map(p => ({
            task_type: p.type,
            prompt_text: p.text,
            category: p.category,
            difficulty_level: p.difficulty,
            base_reward: p.source === 'enterprise' ? 0.25 : 0.10, // Variable default reward
            bonus_reward: 0.05,
            is_active: true,
            source: p.source || 'gap_engine'
        }));

        const { error } = await supabase.from('capture_prompts').insert(dbRecords);

        if (error) {
            console.error("Deploy error:", error);
            throw new Error(error.message);
        }

        return { success: true, count: prompts.length };
    },

    /**
     * Seed the database with 1000+ initial prompts
     */
    seedDatabase: async (): Promise<{ success: boolean; count: number }> => {
        if (!isSupabaseConfigured) throw new Error("Supabase not configured");

        const seeds = getSeedPrompts();
        console.log(`[Seed] preparing ${seeds.length} prompts...`);

        // Batch insert (Supabase limit is usually huge, but let's do chunks of 100 if needed, 
        // typically 1000 is fine in one go for small rows)
        const { error } = await supabase.from('capture_prompts').insert(seeds);

        if (error) {
            console.error("Seed error:", error);
            throw new Error(error.message);
        }

        return { success: true, count: seeds.length };
    },

    /**
     * Get random prompts for a specific type
     */
    getRandomPrompts: async (type: TaskType, count: number = 10): Promise<TaskPrompt[]> => {
        if (!isSupabaseConfigured) return [];
        try {
            // The 5-Source strategy pushes high-value / enterprise data requests to the front
            // of the queue by ordering them by base_reward (which is typically assigned by Admins)
            const { data, error } = await supabase
                .from('capture_prompts')
                .select('*')
                .eq('task_type', type)
                .eq('is_active', true)
                .order('base_reward', { ascending: false })
                .limit(count);

            if (error) throw error;
            return data || [];
        } catch (err: any) {
            console.warn('[Prompts] Fetch error:', err.message);
            return [];
        }
    },

    /**
     * Get a single prompt by ID
     */
    getPromptById: async (id: string): Promise<TaskPrompt | null> => {
        if (!isSupabaseConfigured) return null;
        try {
            const { data, error } = await supabase
                .from('capture_prompts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (err: any) {
            console.warn('[Prompts] Fetch by ID error:', err.message);
            return null;
        }
    }
};


// Helper to generate realistic-looking mock text
function generateMockPromptText(modality: string, context: string, index: number): string {
    const templates = {
        voice: [
            `Describe the impact of ${context} in your local dialect.`,
            `Explain how ${context} works to a 5-year-old.`,
            `Roleplay a conversation about ${context} with a friend.`,
            `Pronounce the following terms related to ${context}.`,
            `Tell a story about a time you experienced ${context}.`
        ],
        image: [
            `Take a photo of ${context} in a busy environment.`,
            `Capture a close-up detail of ${context}.`,
            `Photograph ${context} under low-light conditions.`,
            `Find an example of ${context} that looks old or worn.`,
            `Show how ${context} is used in daily life.`
        ],
        video: [
            `Record a tutorial on how to use ${context}.`,
            `Show the movement or action of ${context}.`,
            `Film a 360-degree view of ${context}.`,
            `Document the process of fixing or maintaining ${context}.`,
            `Capture the sound and visual of ${context} in operation.`
        ],
        text: [
            `Write a short essay about the history of ${context}.`,
            `List 5 slang terms used when talking about ${context}.`,
            `Translate this paragraph about ${context} into Pidgin.`,
            `Explain the cultural significance of ${context}.`,
            `Write a review of ${context}.`
        ]
    };

    const specificTemplates = templates[modality as keyof typeof templates] || templates.text;
    return specificTemplates[index % specificTemplates.length];
}
