export interface JudgeUnlockStats {
    isUnlocked: boolean;
    completedTasks: number;
    requiredTasks: number;
}

const LOCKED_STATS: JudgeUnlockStats = {
    isUnlocked: false,
    completedTasks: 0,
    requiredTasks: 0,
};

/**
 * Normalize the database RPC response without inventing eligibility values.
 * Supabase table RPCs commonly return a single row as a one-item array.
 */
export function normalizeJudgeUnlockStats(value: unknown): JudgeUnlockStats {
    const row = Array.isArray(value) ? value[0] : value;

    if (!row || typeof row !== 'object') return { ...LOCKED_STATS };

    const candidate = row as Record<string, unknown>;
    const isUnlocked = candidate.is_unlocked;
    const completedTasks = candidate.completed_tasks;
    const requiredTasks = candidate.required_tasks;

    if (
        typeof isUnlocked !== 'boolean' ||
        typeof completedTasks !== 'number' ||
        typeof requiredTasks !== 'number' ||
        !Number.isInteger(completedTasks) ||
        !Number.isInteger(requiredTasks) ||
        completedTasks < 0 ||
        requiredTasks <= 0
    ) {
        return { ...LOCKED_STATS };
    }

    return { isUnlocked, completedTasks, requiredTasks };
}
