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
import { normalizePromptGenerationParams } from './promptValidation';

/**
 * Service to manage AI Prompt Generation & Database Seeding
 */
export const PromptService = {

    /** Generate prompts through the authenticated server-side AI function. */
    generateAiPrompts: async (params: PromptGenerationParams): Promise<AiPrompt[]> => {
        const normalized = normalizePromptGenerationParams(params);
        if (!normalized) throw new Error('Invalid prompt generation parameters.');
        if (!isSupabaseConfigured) throw new Error('Prompt generation is unavailable until Supabase is configured.');

        const { data, error } = await supabase.functions.invoke('generate-prompts', {
            body: normalized,
        });

        if (error) {
            console.warn('[Prompts] Generation error:', error.message);
            throw new Error(error.message);
        }

        const prompts = data && typeof data === 'object' && Array.isArray(data.prompts)
            ? data.prompts
            : [];

        if (prompts.length === 0) throw new Error('The prompt service returned no prompts.');
        return prompts as AiPrompt[];
    },

    /**
     * Deploy selected prompts to the database
     */
    deployPrompts: async (prompts: AiPrompt[]): Promise<{ success: boolean; count: number }> => {
        if (!isSupabaseConfigured) {
            throw new Error('Prompt deployment is unavailable until Supabase is configured.');
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
            console.warn("Deploy error:", error.message);
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
            console.warn("Seed error:", error.message);
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
