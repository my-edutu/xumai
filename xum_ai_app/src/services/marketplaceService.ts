import { supabase } from '../supabaseClient';
import {
    FeaturedTask,
    AdminTask,
    TaskType
} from './types';
import { Task } from '../types';
import { getUserTaskStats } from './taskService';

// Helper to check Supabase config
const ensureSupabase = (context: string) => {
    if (!supabase) {
        console.warn(`[${context}] Supabase client not initialized`);
        return false;
    }
    return true;
};

/**
 * Get active featured promo cards
 */
export async function getFeaturedTasks(): Promise<FeaturedTask[]> {
    if (!ensureSupabase('Featured')) return [];
    try {
        const { data, error } = await supabase
            .from('featured_tasks')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.warn('[Featured] Query error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[Featured] Network error:', err.message);
        return [];
    }
}

/**
 * Get daily missions for the user
 */
export async function getDailyMissions(userId: string): Promise<AdminTask[]> {
    if (!ensureSupabase('Missions')) return [];
    try {
        const { data, error } = await supabase.rpc('get_daily_missions', {
            p_user_id: userId,
        });

        if (error) {
            console.warn('[Missions] RPC error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[Missions] Network error:', err.message);
        return [];
    }
}

/**
 * Get XUM Judge tasks with unlock status
 */
export async function getXumJudgeTasks(userId: string): Promise<AdminTask[]> {
    if (!ensureSupabase('Judge')) return [];
    try {
        const { data, error } = await supabase.rpc('get_xum_judge_tasks', {
            p_user_id: userId,
        });

        if (error) {
            console.warn('[Judge] RPC error:', error.message);
            return [];
        }

        // The RPC returns { task_data, is_unlocked }. We need to flatten it
        return (data || []).map((item: any) => ({
            ...item.task_data,
            is_unlocked: item.is_unlocked
        }));
    } catch (err: any) {
        console.warn('[Judge] Network error:', err.message);
        return [];
    }
}

/**
 * Get active tasks for the marketplace
 */
export async function getActiveTasks(): Promise<Task[]> {
    if (!ensureSupabase('ActiveTasks')) return [];
    try {
        const fetchPromise = supabase
            .from('tasks')
            .select('*')
            .eq('status', 'active');

        // 10s timeout
        const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 10000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) {
            console.warn('[ActiveTasks] Query error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[ActiveTasks] Network error:', err.message);
        return [];
    }
}

/**
 * Check if user has completed enough tasks to unlock XUM Judge
 */
export async function checkJudgeUnlock(userId: string): Promise<{ isUnlocked: boolean; completedTasks: number; requiredTasks: number }> {
    try {
        // TODO: In the future, fetch `requiredTasks` from an admin `app_config` table
        const requiredTasks = 10;
        
        const { count, error } = await supabase
            .from('task_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (error) {
            console.error('[JudgeUnlock] Error checking tasks:', error);
            return { isUnlocked: false, completedTasks: 0, requiredTasks };
        }

        const completedTasks = count || 0;
        return {
            isUnlocked: completedTasks >= requiredTasks,
            completedTasks,
            requiredTasks
        };
    } catch (err: any) {
        console.error('[JudgeUnlock] check error:', err.message);
        // Default to locked with 0 required tasks just as a fallback
        return { isUnlocked: false, completedTasks: 0, requiredTasks: 10 };
    }
}

/**
 * Get feed tasks — merges regular tasks + active company campaigns.
 * Campaign items receive feedPriority=10 and float above regular tasks.
 */
export async function getFeedTasks(category: string = 'All'): Promise<any[]> {
    if (!ensureSupabase('Feed')) return [];

    const typeMap: Record<string, string> = {
        Voice: 'voice', Text: 'text', Image: 'image',
        Video: 'video', Validation: 'validation',
    };
    const dbType = category !== 'All' ? (typeMap[category] || category.toLowerCase()) : null;

    try {
        // ── 1. Regular tasks ──────────────────────────────────────────────
        let taskQuery = supabase
            .from('tasks')
            .select(`
                id, title, description, task_type, reward_per_submission,
                time_estimate, difficulty,
                companies:company_id ( name )
            `)
            .eq('status', 'active');

        if (dbType) taskQuery = taskQuery.eq('task_type', dbType);

        const [taskResult, campaignResult] = await Promise.allSettled([
            taskQuery.order('created_at', { ascending: false }).limit(20),
            (() => {
                let cq = supabase
                    .from('company_campaigns')
                    .select('*')
                    .eq('status', 'active')
                    .order('feed_priority', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (dbType) cq = cq.eq('task_type', dbType);
                return cq;
            })(),
        ]);

        const regularTasks = taskResult.status === 'fulfilled' && !taskResult.value.error
            ? (taskResult.value.data || []).map((t: any) => ({
                id: t.id,
                type: t.task_type.charAt(0).toUpperCase() + t.task_type.slice(1),
                title: t.title,
                subtitle: t.description || t.companies?.name || 'New Task',
                reward: t.reward_per_submission,
                time: t.time_estimate || '2 min',
                difficulty: t.difficulty || 'Easy',
                icon: getTaskIcon(t.task_type),
                color: getTaskColor(t.task_type),
                screen: getTaskScreen(t.task_type),
                isCampaign: false,
                feedPriority: 0,
            }))
            : [];

        const now = new Date();
        const campaignTasks = campaignResult.status === 'fulfilled' && !campaignResult.value.error
            ? (campaignResult.value.data || []).map((c: any) => {
                const endsAt = c.ends_at ? new Date(c.ends_at) : null;
                const daysLeft = endsAt
                    ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000))
                    : (c.timeframe_days ?? 30);
                const progressPercent = c.target_count > 0
                    ? Math.round((c.completed_count / c.target_count) * 100)
                    : 0;
                const baseRate = c.base_rate_per_item ?? 0.10;
                return {
                    id: c.id,
                    type: c.task_type.charAt(0).toUpperCase() + c.task_type.slice(1),
                    title: c.title,
                    subtitle: c.description || 'Company Campaign',
                    reward: baseRate,
                    time: '2-5 min',
                    difficulty: c.quality_tier === 'premium' ? 'Hard' : c.quality_tier === 'standard' ? 'Medium' : 'Easy',
                    icon: getTaskIcon(c.task_type),
                    color: getTaskColor(c.task_type),
                    screen: getTaskScreen(c.task_type),
                    isCampaign: true,
                    feedPriority: c.feed_priority ?? 10,
                    daysLeft,
                    companyName: c.company_name || 'XUM Partner',
                    progressPercent,
                    campaignId: c.id,
                    targetCount: c.target_count,
                    completedCount: c.completed_count,
                    qualityTier: c.quality_tier,
                    regions: c.region_filter || [],
                    gradientStart: getTaskColor(c.task_type),
                    gradientEnd: getTaskColor(c.task_type),
                };
            })
            : [];

        // ── 2. Merge & sort: campaigns float first, then regular tasks ────
        const combined = [...campaignTasks, ...regularTasks];
        combined.sort((a, b) => (b.feedPriority ?? 0) - (a.feedPriority ?? 0));
        return combined;
    } catch (err: any) {
        console.warn('[Feed] Network error:', err.message);
        return [];
    }
}

// Helpers for mapping
function getTaskIcon(type: string): string {
    const map: Record<string, string> = { voice: 'mic', image: 'image', video: 'videocam', text: 'text-fields', validation: 'verified' };
    return map[type] || 'assignment';
}

function getTaskColor(type: string): string {
    const map: Record<string, string> = { voice: '#ec4899', image: '#8b5cf6', video: '#10b981', text: '#3b82f6', validation: '#f59e0b' };
    return map[type] || '#64748b';
}

function getTaskScreen(type: string): string {
    const map: Record<string, string> = {
        voice: 'VOICE_TASK',
        image: 'IMAGE_TASK',
        video: 'VIDEO_TASK',
        text: 'LINGUASENSE_ENGINE',
        validation: 'VALIDATION_TASK_EXECUTION'
    };
    return map[type] || 'HOME';
}
