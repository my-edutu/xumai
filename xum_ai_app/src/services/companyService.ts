import { supabase } from '../supabaseClient';
import { CompanyNotification, DatasetManifest, DatasetItem } from './types';

// Helper to check Supabase config
const ensureSupabase = (context: string) => {
    if (!supabase) {
        console.warn(`[${context}] Supabase client not initialized`);
        return false;
    }
    return true;
};

/**
 * Fetch all approved submissions + enriched metadata for a company task.
 * Returns a structured manifest ready for JSON export.
 */
export async function getCompanyDataset(
    taskId: string,
    taskTitle: string
): Promise<{ success: boolean; manifest?: DatasetManifest; error?: string }> {
    if (!ensureSupabase('Dataset')) return { success: false, error: 'Supabase not configured' };
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select(`
                id, submitted_at, submission_data,
                submission_metadata (
                    user_name, user_language, user_country, user_role, user_level,
                    task_type, task_category, difficulty_level, platform,
                    file_size_bytes, duration_seconds, captured_at
                )
            `)
            .eq('task_id', taskId)
            .eq('status', 'approved')
            .order('submitted_at', { ascending: true });

        if (error) return { success: false, error: error.message };

        const items: DatasetItem[] = (data || []).map((row: any) => {
            const meta = Array.isArray(row.submission_metadata)
                ? row.submission_metadata[0]
                : row.submission_metadata;

            return {
                id: row.id,
                file_url: row.submission_data?.file_url ?? null,
                submitted_at: row.submitted_at,
                contributor: {
                    name: meta?.user_name ?? null,
                    language: meta?.user_language ?? null,
                    country: meta?.user_country ?? null,
                    role: meta?.user_role ?? null,
                    level: meta?.user_level ?? null,
                },
                task: {
                    type: meta?.task_type ?? null,
                    category: meta?.task_category ?? null,
                    difficulty: meta?.difficulty_level ?? null,
                },
                capture: {
                    platform: meta?.platform ?? null,
                    file_size_bytes: meta?.file_size_bytes ?? null,
                    duration_seconds: meta?.duration_seconds ?? null,
                    captured_at: meta?.captured_at ?? null,
                },
            };
        });

        const manifest: DatasetManifest = {
            dataset_id: taskId,
            task_title: taskTitle,
            exported_at: new Date().toISOString(),
            total_approved: items.length,
            format_version: '1.0',
            items,
        };

        return { success: true, manifest };
    } catch (err: any) {
        console.warn('[Dataset] Export error:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Get latest 30 notifications for a company (unread first).
 */
export async function getCompanyNotifications(
    companyId: string
): Promise<CompanyNotification[]> {
    if (!ensureSupabase('CompanyNotif')) return [];
    try {
        const { data, error } = await supabase.rpc('get_company_notifications', {
            p_company_id: companyId,
        });
        if (error) { console.warn('[CompanyNotif] RPC error:', error.message); return []; }
        return (data || []) as CompanyNotification[];
    } catch { return []; }
}

/**
 * Mark all unread notifications as read for a company.
 */
export async function markNotificationsRead(companyId: string): Promise<void> {
    if (!ensureSupabase('CompanyNotif')) return;
    try {
        await supabase.rpc('mark_company_notifications_read', { p_company_id: companyId });
    } catch { /* non-blocking */ }
}
