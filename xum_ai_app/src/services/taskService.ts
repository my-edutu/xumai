/**
 * XUM AI - Task Submission Service
 * 
 * Handles media uploads to Supabase Storage and task submission to database.
 * Supports voice recordings, images, and videos.
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Task, SubmissionMetadata } from '../types';
import { PromptService } from './promptService';
import { QualityService } from './qualityService';
import {
    TaskType,
    SubmissionStatus,
    TaskPrompt,
    TaskSubmission,
    UploadResult,
    SubmissionResult,
    FeaturedTask,
    AdminTask,
    Transaction,
    LeaderboardEntry,
    DatasetItem,
    DatasetManifest,
    CompanyNotification,
    LexiconConcept,
    ValidationTask
} from './types';

// ============================================================================
// GUARD HELPER
// ============================================================================

function ensureSupabase(tag: string): boolean {
    if (!isSupabaseConfigured) {
        console.warn(`[${tag}] Supabase not configured – skipping request`);
        return false;
    }
    return true;
}

// ============================================================================
// STORAGE BUCKETS
// ============================================================================

const STORAGE_BUCKETS: Record<string, string> = {
    voice: 'voice-recordings',
    image: 'image-captures',
    video: 'video-recordings',
    text: 'text-artifacts',
    validation: 'validation-artifacts',
    rlhf: 'rlhf-artifacts',
};

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
    localUri: string,
    taskType: TaskType,
    userId: string,
    fileExtension: string
): Promise<UploadResult> {
    if (!ensureSupabase('Upload')) return { success: false, error: 'Supabase not configured' };
    try {
        console.log(`[Upload] Starting upload for ${taskType} task (${fileExtension})`);

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${userId}/${timestamp}.${fileExtension}`;
        const bucket = STORAGE_BUCKETS[taskType];

        // Validate local URI
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
            throw new Error(`File not found at path: ${localUri}`);
        }
        const fileSize = (fileInfo as any).size || 0;

        // Read file as base64
        // NOTE: For very large video files, this might cause OOM. 
        // Ideally we would use uploadAsync for large files, but that requires signed URLs or a different flow.
        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: 'base64',
        });

        // Determine content type
        const contentType = getContentType(taskType, fileExtension);

        // Upload to Supabase Storage with timeout
        const uploadPromise = supabase.storage
            .from(bucket)
            .upload(filename, decode(base64), {
                contentType,
                upsert: false,
            });

        const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('Upload request timed out after 30s')), 30000)
        );

        const raceResult = await Promise.race([uploadPromise, timeoutPromise]) as { data: any; error: any };
        const { data, error } = raceResult;

        if (error) {
            console.warn('[Upload] Storage error:', error.message);
            return { success: false, error: error.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename);

        console.log('[Upload] Success:', urlData.publicUrl);

        return {
            success: true,
            url: urlData.publicUrl,
            filePath: data.path,
        };
    } catch (err: any) {
        console.warn('[Upload] Network error:', err.message);
        return { success: false, error: err.message || 'Upload failed' };
    }
}

/**
 * Get MIME content type based on task type and file extension
 */
function getContentType(taskType: TaskType, extension: string): string {
    switch (taskType) {
        case 'voice':
            if (extension === 'webm') return 'audio/webm';
            if (extension === 'm4a') return 'audio/m4a';
            return 'audio/mpeg';
        case 'image':
            if (extension === 'png') return 'image/png';
            if (extension === 'webp') return 'image/webp';
            return 'image/jpeg';
        case 'video':
            if (extension === 'webm') return 'video/webm';
            return 'video/mp4';
        default:
            return 'application/octet-stream';
    }
}

// ============================================================================
// HEALTH & CONFIG
// ============================================================================

/**
 * Check if the service is properly configured and connected to Supabase
 */
export async function checkServiceHealth(): Promise<{
    configured: boolean;
    connected: boolean;
    error?: string;
}> {
    try {
        if (!isSupabaseConfigured) {
            return { configured: false, connected: false, error: 'Supabase credentials missing' };
        }

        // Simple ping to check connection
        const { error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
            return { configured: true, connected: false, error: error.message };
        }

        return { configured: true, connected: true };
    } catch (err: any) {
        return { configured: false, connected: false, error: err.message };
    }
}



// ============================================================================
// SUBMISSION FUNCTIONS
// ============================================================================

/**
 * Legacy/Generic submission wrapper for quick tasks
 */
export async function submitPayload(
    slug: string,
    payload: any,
    reward: number,
    xp: number
): Promise<boolean> {
    try {
        console.log(`[SubmitPayload] Processing ${slug}`, payload);

        // Mock userId for now or get from auth context if possible
        // In a real app, userId should be passed in or retrieved from session
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) throw new Error("User not authenticated");

        let fileUrl = payload.uri; // Default to local URI if upload fails

        // 1. Upload if URI is present
        if (payload.uri && payload.type) {
            const upload = await uploadFile(
                payload.uri,
                payload.type as TaskType,
                userId,
                payload.type === 'video' ? 'mp4' : payload.type === 'image' ? 'jpg' : 'm4a'
            );
            if (upload.success && upload.url) {
                fileUrl = upload.url;
            }
        }

        // 2. Submit to DB using a generic prompt ID fallback
        // We use a specific generic ID for each type if available, or a system default
        const genericPromptId = "00000000-0000-0000-0000-000000000000";

        await submitTask(
            userId,
            genericPromptId,
            payload.type as TaskType,
            fileUrl,
            {
                description: payload.description || payload.title || slug,
                durationSeconds: 0, // Calculate if possible
                metadata: { xp, slug },
                campaignId: payload.campaignId // Pass campaignId if present
            }
        );

        return true;
    } catch (e) {
        console.error("Payload submission error", e);
        return false;
    }
}

/**
 * Submit a completed task
 */
export async function submitTask(
    userId: string,
    promptId: string,
    taskType: TaskType,
    fileUrl: string,
    options: {
        translationText?: string;
        description?: string;
        durationSeconds?: number;
        fileSize?: number;
        sessionId?: string;
        metadata?: Record<string, any>;
        campaignId?: string;
    } = {}
): Promise<SubmissionResult> {
    if (!ensureSupabase('Submit')) return { success: false, error: 'Supabase not configured' };
    try {
        // Get prompt details for reward calculation
        const prompt = await PromptService.getPromptById(promptId);
        const baseReward = prompt?.base_reward || 0.15;
        const bonusReward = options.translationText ? (prompt?.bonus_reward || 0.10) : 0;
        const totalReward = baseReward + bonusReward;

        // Map to DB schema: submissions table uses submission_data JSONB
        const dbRecord = {
            task_id: promptId,
            campaign_id: options.campaignId || null,
            user_id: userId,
            submission_data: {
                task_type: taskType,
                file_url: fileUrl,
                file_size: options.fileSize,
                duration_seconds: options.durationSeconds,
                translation_text: options.translationText,
                description: options.description,
                base_reward: baseReward,
                bonus_reward: bonusReward,
                total_reward: totalReward,
                session_id: options.sessionId,
                quality_score: options.metadata?.qualityScore ?? null,
                metrics: options.metadata?.metrics ?? {},
                metadata: options.metadata,
            },
            status: 'pending',
            time_spent_seconds: options.durationSeconds,
        };

        const { data, error } = await supabase
            .from('submissions')
            .insert(dbRecord)
            .select()
            .single();

        if (error) {
            console.warn('[Submit] Insert error:', error.message);
            return { success: false, error: error.message };
        }

        // Log activity
        await logTaskActivity(userId, taskType, totalReward, data.id);

        // Save enriched metadata — non-blocking, never fails the submission.
        // prompt is already fetched above for reward calc — reuse it here (no extra DB call).
        // useTask passes fileSize/durationSeconds inside options.metadata (not top-level).
        const platform = (options.metadata?.collectedMetadata as any)?.platform as string | undefined;
        const fileSizeBytes = options.fileSize ?? (options.metadata?.fileSize as number | undefined);
        const durationSecs = options.durationSeconds ?? (options.metadata?.durationSeconds as number | undefined);

        saveSubmissionMetadata(data.id, taskType, userId, {
            platform,
            file_size_bytes: fileSizeBytes,
            duration_seconds: durationSecs,
            session_id: options.sessionId,
            // Prompt context — prompt already fetched above, zero extra DB calls
            prompt_id: promptId,
            prompt_text: prompt?.prompt_text,
            task_category: prompt?.category ?? undefined,
            difficulty_level: prompt?.difficulty_level ?? undefined,
            prompt_language_code: prompt?.language_code ?? undefined,
        }).catch(() => {/* already logged inside saveSubmissionMetadata */ });

        return { success: true, submission: data };
    } catch (err: any) {
        console.warn('[Submit] Network error:', err.message);
        return { success: false, error: err.message || 'Submission failed' };
    }
}

// ============================================================================
// METADATA FUNCTIONS
// ============================================================================

/**
 * Save enriched submission metadata to the submission_metadata table.
 *
 * Auto-fetches user profile (name, language, country, role, level) from
 * the users table so no user interaction is ever required.
 * This is non-blocking — a failure here does NOT block the submission.
 */
export async function saveSubmissionMetadata(
    submissionId: string,
    taskType: TaskType,
    userId: string,
    options: {
        // From device / session (auto-captured)
        platform?: string;
        file_size_bytes?: number;
        duration_seconds?: number;
        session_id?: string;
        // From the prompt (passed in from submitTask)
        prompt_id?: string;
        prompt_text?: string;
        task_category?: string;
        difficulty_level?: number;
        prompt_language_code?: string;
    }
): Promise<void> {
    if (!ensureSupabase('Metadata')) return;
    try {
        // ── 1. Fetch user profile (name, language, location, role, level) ─────
        const { data: userProfile } = await supabase
            .from('users')
            .select('full_name, preferred_language, location, role, level')
            .eq('id', userId)
            .single();

        // ── 2. Build the metadata record ──────────────────────────────────────
        const record: Record<string, any> = {
            submission_id: submissionId,
            task_type: taskType,
            platform: options.platform || 'unknown',
            consent_given: true,

            // User profile — auto-attached, no user input needed
            user_name: userProfile?.full_name ?? null,
            user_language: userProfile?.preferred_language ?? null,
            user_country: userProfile?.location ?? null,
            user_role: userProfile?.role ?? null,
            user_level: userProfile?.level ?? null,
        };

        // Prompt / task context
        if (options.prompt_id) record.prompt_id = options.prompt_id;
        if (options.prompt_text) record.prompt_text = options.prompt_text;
        if (options.task_category) record.task_category = options.task_category;
        if (options.difficulty_level !== undefined) record.difficulty_level = options.difficulty_level;

        // Language — prefer user's profile language; fall back to prompt's language_code
        if (!record.user_language && options.prompt_language_code) {
            record.language = options.prompt_language_code;
        }

        // File / media metrics
        if (options.file_size_bytes !== undefined) record.file_size_bytes = options.file_size_bytes;
        if (options.duration_seconds !== undefined) record.duration_seconds = options.duration_seconds;

        // ── 3. Insert ─────────────────────────────────────────────────────────
        const { error } = await supabase
            .from('submission_metadata')
            .insert(record);

        if (error) {
            console.warn('[Metadata] Save error (non-blocking):', error.message);
        } else {
            console.log('[Metadata] Saved — user:', record.user_name, '| lang:', record.user_language, '| type:', taskType);
        }
    } catch (err: any) {
        console.warn('[Metadata] Network error (non-blocking):', err.message);
    }
}

/**
 * Log task activity to user_activities table
 */
async function logTaskActivity(
    userId: string,
    taskType: TaskType,
    reward: number,
    submissionId: string
): Promise<void> {
    try {
        const activityType = taskType === 'voice' ? 'voice_recording'
            : taskType === 'image' ? 'image_capture'
                : taskType === 'video' ? 'video_recording'
                    : taskType === 'text' ? 'text_entry'
                        : taskType === 'validation' ? 'validation_review'
                            : 'rlhf_correction';

        await supabase.rpc('log_user_activity', {
            p_user_id: userId,
            p_activity_type: activityType,
            p_description: `Completed ${taskType} capture task`,
            p_reference_type: 'task_submission',
            p_reference_id: submissionId,
            p_reward: reward,
        });
    } catch (err) {
        console.warn('[Activity] Failed to log activity:', err);
    }
}

/**
 * Get user's submission history
 */
export async function getUserSubmissions(
    userId: string,
    options: {
        taskType?: TaskType;
        status?: SubmissionStatus;
        limit?: number;
        offset?: number;
    } = {}
): Promise<TaskSubmission[]> {
    if (!ensureSupabase('Submissions')) return [];
    try {
        let query = supabase
            .from('submissions')
            .select('*, tasks(task_type, reward, title)')
            .eq('user_id', userId)
            .order('submitted_at', { ascending: false });

        if (options.taskType) {
            query = query.eq('submission_data->>task_type', options.taskType);
        }
        if (options.status) {
            query = query.eq('status', options.status);
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            console.warn('[Submissions] Query error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[Submissions] Network error:', err.message);
        return [];
    }
}

/**
 * Get user's task statistics
 */
export async function getUserTaskStats(userId: string): Promise<{
    totalSubmissions: number;
    pendingReview: number;
    approved: number;
    totalEarned: number;
    voiceCount: number;
    imageCount: number;
    videoCount: number;
}> {
    const empty = { totalSubmissions: 0, pendingReview: 0, approved: 0, totalEarned: 0, voiceCount: 0, imageCount: 0, videoCount: 0 };
    if (!ensureSupabase('Stats')) return empty;
    try {
        const { data, error } = await supabase.rpc('get_user_earnings', {
            p_user_id: userId,
        });

        if (error || !data) {
            return {
                totalSubmissions: 0,
                pendingReview: 0,
                approved: 0,
                totalEarned: 0,
                voiceCount: 0,
                imageCount: 0,
                videoCount: 0,
            };
        }

        return {
            totalSubmissions: data.total_submissions || 0,
            pendingReview: data.pending_submissions || 0,
            approved: data.approved_submissions || 0,
            totalEarned: data.total_earned || 0,
            voiceCount: data.voice_count || 0,
            imageCount: data.image_count || 0,
            videoCount: data.video_count || 0,
        };
    } catch (err: any) {
        console.warn('[Stats] Network error:', err.message);
        return empty;
    }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get user badges based on their stats
 */
export async function getUserBadges(userId: string): Promise<{
    title: string;
    icon: string;
    color: string;
    desc: string;
}[]> {
    try {
        const stats = await getUserTaskStats(userId);
        const badges = [];

        // Early Bird (All users for now)
        badges.push({ title: 'Early Bird', icon: 'wb-sunny', color: '#f59e0b', desc: 'Joined in beta' });

        // Voice Pro
        if (stats.voiceCount >= 10) {
            badges.push({ title: 'Voice Pro', icon: 'mic', color: '#ec4899', desc: `${stats.voiceCount}+ Voice Tasks` });
        }

        // Shutterbug (Image)
        if (stats.imageCount >= 10) {
            badges.push({ title: 'Shutterbug', icon: 'photo-camera', color: '#3b82f6', desc: `${stats.imageCount}+ Images` });
        }

        // Director (Video)
        if (stats.videoCount >= 5) {
            badges.push({ title: 'Director', icon: 'videocam', color: '#8b5cf6', desc: `${stats.videoCount}+ Videos` });
        }

        // High Earner
        if (stats.totalEarned >= 50) {
            badges.push({ title: 'High Earner', icon: 'attach-money', color: '#10b981', desc: 'Earned $50+' });
        }

        // Verified (Mock check for now, can be real later)
        if (stats.approved >= 1) {
            badges.push({ title: 'Verified', icon: 'verified', color: '#3b82f6', desc: 'Identity confirmed' });
        }

        return badges;
    } catch (err) {
        console.warn('Failed to get badges', err);
        return [
            { title: 'Early Bird', icon: 'wb-sunny', color: '#f59e0b', desc: 'Joined in beta' }
        ];
    }
}

/**
 * Generate a new session ID for grouping tasks
 */
export function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}





// ============================================================================
// COMPANY DATASET EXPORT & NOTIFICATIONS
// ============================================================================


// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// FEED & EARNINGS FUNCTIONS
// ============================================================================



export const TaskService = {
    // Media & Submissions
    uploadFile,

    submitTask,
    submitPayload,
    getUserSubmissions,
    getUserTaskStats,

    // Home & Marketplace
    // (Moved to marketplaceService.ts)

    // Metadata
    saveSubmissionMetadata,

    // Company dataset export & notifications
    // (Moved to companyService.ts)

    // Other
    generateSessionId,
    checkServiceHealth,

    /**
     * Fetch lexicon concepts that the user hasn't submitted yet
     */
    async getAvailableLexiconConcepts(userId: string): Promise<LexiconConcept[]> {
        if (!ensureSupabase('Lexicon')) return [];
        try {
            // Get IDs of concepts user already submitted
            const { data: submittedIds } = await supabase
                .from('lexicon_submissions')
                .select('concept_id')
                .eq('user_id', userId);

            const excludedIds = (submittedIds || []).map(s => s.concept_id).filter(Boolean);

            let query = supabase
                .from('lexicon_concepts')
                .select('*')
                .eq('status', 'active');

            if (excludedIds.length > 0) {
                query = query.not('id', 'in', `(${excludedIds.join(',')})`);
            }

            const { data, error } = await query.limit(20);
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('[Lexicon] Fetch error:', err);
            return [];
        }
    },

    /**
     * Fetch pending submissions for human validation (consensus layer)
     */
    async fetchValidationTasks(userId: string): Promise<ValidationTask[]> {
        if (!ensureSupabase('Validation')) return [];
        try {
            // Fetch Lexicon pending submissions not by this user and not already voted on by this user
            const { data: votedLexicon } = await supabase
                .from('validation_votes')
                .select('submission_id')
                .eq('user_id', userId)
                .eq('submission_type', 'lexicon');

            const votedLexiconIds = (votedLexicon || []).map(v => v.submission_id);

            const { data: lexiconPending, error: lexError } = await supabase
                .from('lexicon_submissions')
                .select('*')
                .eq('status', 'pending')
                .neq('user_id', userId)
                .not('id', 'in', `(${votedLexiconIds.length > 0 ? votedLexiconIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
                .limit(5);

            if (lexError) throw lexError;

            // Fetch RLHF pending submissions
            const { data: votedRLHF } = await supabase
                .from('validation_votes')
                .select('submission_id')
                .eq('user_id', userId)
                .eq('submission_type', 'rlhf');

            const votedRLHFIds = (votedRLHF || []).map(v => v.submission_id);

            const { data: rlhfPending, error: rlhfError } = await supabase
                .from('rlhf_submissions')
                .select('*')
                .eq('status', 'pending')
                .neq('user_id', userId)
                .not('id', 'in', `(${votedRLHFIds.length > 0 ? votedRLHFIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
                .limit(5);

            if (rlhfError) throw rlhfError;

            // Map to ValidationTask
            const tasks: ValidationTask[] = [];

            (lexiconPending || []).forEach(lp => {
                tasks.push({
                    id: lp.id,
                    submission_type: 'lexicon',
                    prompt: `Validate: "${lp.concept}"`,
                    details: {
                        concept: lp.concept,
                        local_word: lp.local_word,
                        cultural_note: lp.cultural_note,
                        pronunciation_url: lp.pronunciation_url,
                    },
                    reward: 0.20, // Validation reward
                });
            });

            (rlhfPending || []).forEach(rp => {
                tasks.push({
                    id: rp.id,
                    submission_type: 'rlhf',
                    prompt: 'Compare RLHF Correction',
                    details: {
                        original_response: rp.original_response,
                        corrected_response: rp.corrected_response,
                        correction_reason: rp.correction_reason,
                        cultural_region: rp.cultural_region,
                    },
                    reward: 0.30,
                });
            });

            return tasks;
        } catch (err) {
            console.warn('[Validation] Fetch error:', err);
            return [];
        }
    },

    /**
     * Submit a validation vote
     */
    async submitValidationVote(
        userId: string,
        submissionId: string,
        submissionType: 'lexicon' | 'rlhf',
        vote: 'approve' | 'reject',
        reason?: string
    ): Promise<boolean> {
        if (!ensureSupabase('Vote')) return false;
        try {
            const { error } = await supabase
                .from('validation_votes')
                .insert({
                    user_id: userId,
                    submission_id: submissionId,
                    submission_type: submissionType,
                    vote,
                    reason,
                });

            if (error) throw error;
            return true;
        } catch (err) {
            console.warn('[Vote] Submit error:', err);
            return false;
        }
    }
};


export default TaskService;
