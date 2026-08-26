import type { PromptGenerationParams } from './promptService';

const MODALITIES = new Set<PromptGenerationParams['modality']>([
    'voice',
    'image',
    'video',
    'text',
]);

/** Normalize and validate data before it crosses the prompt-generation API boundary. */
export function normalizePromptGenerationParams(
    value: PromptGenerationParams,
): PromptGenerationParams | null {
    const goal = value.goal.trim();
    const context = value.context.trim();
    const count = Math.floor(value.count);

    if (!goal || !context || !MODALITIES.has(value.modality) || !Number.isFinite(count)) {
        return null;
    }

    return {
        goal,
        context,
        modality: value.modality,
        count: Math.min(50, Math.max(1, count)),
    };
}
