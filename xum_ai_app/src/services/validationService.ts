/**
 * XUM AI — Validation Service
 *
 * Human-validation layer:
 *   • Fetch next pending submission (not owned by, or already voted on, by this user)
 *   • Submit approve/reject vote
 *   • Finalize consensus after ≥3 votes (≥66% approve → approved, ≤33% → rejected)
 *   • Award $0.08 validator reward on consensus
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';

// ============================================================================
// GUARD
// ============================================================================

function ensureSupabase(tag: string): boolean {
    if (!isSupabaseConfigured) {
        console.warn(`[${tag}] Supabase not configured — skipping`);
        return false;
    }
    return true;
}

/**
 * Valid submission types handled by the unified judge
 */
export type SubmissionType = 'generic' | 'lexicon' | 'rlhf';

// ============================================================================
// TYPES
// ============================================================================

export interface SubmissionToValidate {
    id: string;
    submission_type: SubmissionType;
    task_type: string;
    prompt: string;
    reward: number;
    details: {
        file_url?: string;
        description?: string;
        translation_text?: string;
        concept?: string;
        local_word?: string;
        cultural_note?: string;
        pronunciation_url?: string;
        original_response?: string;
        corrected_response?: string;
        correction_reason?: string;
        [key: string]: any;
    };
    created_at: string;
    user_id: string;
}

export interface ValidationStats {
    total: number;
    accuracy: number;
    rewardsEarned: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VALIDATOR_REWARD = 0.08;
const MIN_VOTES_FOR_CONSENSUS = 3;
const APPROVE_THRESHOLD = 0.66; // ≥66% approve → approved
const REJECT_THRESHOLD = 0.33;  // ≤33% approve → rejected

// ============================================================================
// FETCH
// ============================================================================

/**
 * Fetch one pending submission from any of the sources (prioritizing lexicon/rlhf)
 */
export async function getNextSubmissionToValidate(
    userId: string
): Promise<SubmissionToValidate | null> {
    if (!ensureSupabase('GetNext')) return null;
    try {
        // 1. Try Lexicon first (High priority for project goals)
        const lexiconTask = await fetchNextLexiconTask(userId);
        if (lexiconTask) return lexiconTask;

        // 2. Try RLHF
        const rlhfTask = await fetchNextRLHFTask(userId);
        if (rlhfTask) return rlhfTask;

        // 3. Fallback to generic submissions
        const genericTask = await fetchNextGenericTask(userId);
        if (genericTask) return genericTask;

        return null;
    } catch (err: any) {
        console.warn('[GetNext] Error:', err.message);
        return null;
    }
}

async function fetchNextLexiconTask(userId: string): Promise<SubmissionToValidate | null> {
    const { data: voted } = await supabase.from('validation_votes').select('submission_id').eq('user_id', userId).eq('submission_type', 'lexicon');
    const votedIds = (voted || []).map(v => v.submission_id);

    const { data } = await supabase
        .from('lexicon_submissions')
        .select('*')
        .eq('status', 'pending')
        .neq('user_id', userId)
        .not('id', 'in', `(${votedIds.length > 0 ? votedIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .order('submitted_at', { ascending: true })
        .limit(1);

    if (!data || data.length === 0) return null;
    const lp = data[0];
    return {
        id: lp.id,
        submission_type: 'lexicon',
        task_type: 'audio',
        prompt: `Validate: "${lp.concept}"`,
        reward: 0.20,
        details: {
            concept: lp.concept,
            local_word: lp.local_word,
            cultural_note: lp.cultural_note,
            pronunciation_url: lp.pronunciation_url,
        },
        created_at: lp.submitted_at,
        user_id: lp.user_id,
    };
}

async function fetchNextRLHFTask(userId: string): Promise<SubmissionToValidate | null> {
    const { data: voted } = await supabase.from('validation_votes').select('submission_id').eq('user_id', userId).eq('submission_type', 'rlhf');
    const votedIds = (voted || []).map(v => v.submission_id);

    const { data } = await supabase
        .from('rlhf_submissions')
        .select('*')
        .eq('status', 'pending')
        .neq('user_id', userId)
        .not('id', 'in', `(${votedIds.length > 0 ? votedIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .order('created_at', { ascending: true })
        .limit(1);

    if (!data || data.length === 0) return null;
    const rp = data[0];
    return {
        id: rp.id,
        submission_type: 'rlhf',
        task_type: 'text',
        prompt: 'Compare RLHF Correction',
        reward: 0.30,
        details: {
            original_response: rp.original_response,
            corrected_response: rp.corrected_response,
            correction_reason: rp.correction_reason,
        },
        created_at: rp.created_at,
        user_id: rp.user_id,
    };
}

async function fetchNextGenericTask(userId: string): Promise<SubmissionToValidate | null> {
    const { data: voted } = await supabase.from('submission_validations').select('submission_id').eq('validator_id', userId);
    const votedIds = (voted || []).map(v => v.submission_id);

    const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'pending')
        .neq('user_id', userId)
        .not('id', 'in', `(${votedIds.length > 0 ? votedIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .order('created_at', { ascending: true })
        .limit(1);

    if (!data || data.length === 0) return null;
    const row = data[0];
    return {
        id: row.id,
        submission_type: 'generic',
        task_type: (row.submission_data as any)?.task_type ?? 'unknown',
        prompt: (row.submission_data as any)?.description ?? 'Validate submission',
        reward: VALIDATOR_REWARD,
        details: row.submission_data ?? {},
        created_at: row.created_at,
        user_id: row.user_id,
    };
}

// ============================================================================
// VOTE
// ============================================================================

/**
 * Cast a validation vote.
 * After inserting, triggers consensus check.
 */
export async function submitValidationVote(
    submissionId: string,
    validatorId: string,
    submissionType: SubmissionType,
    vote: 'approve' | 'reject',
    confidence: number = 3,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    if (!ensureSupabase('Vote')) return { success: false, error: 'Supabase not configured' };
    try {
        if (submissionType === 'generic') {
            const { error } = await supabase
                .from('submission_validations')
                .insert({
                    submission_id: submissionId,
                    validator_id: validatorId,
                    vote,
                    confidence: Math.max(1, Math.min(5, confidence)),
                    reason: reason || null,
                });
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('validation_votes')
                .insert({
                    submission_id: submissionId,
                    user_id: validatorId,
                    submission_type: submissionType,
                    vote,
                    reason: reason || null,
                });
            if (error) throw error;
        }

        // Non-blocking consensus check
        checkAndFinalizeConsensus(submissionId, validatorId, submissionType).catch((e) =>
            console.warn('[Vote] Consensus error:', e.message)
        );

        return { success: true };
    } catch (err: any) {
        console.warn('[Vote] Error:', err.message);
        return { success: false, error: err.message ?? 'Vote failed' };
    }
}

// ============================================================================
// CONSENSUS
// ============================================================================

async function checkAndFinalizeConsensus(
    submissionId: string,
    lastValidatorId: string,
    submissionType: SubmissionType
): Promise<void> {
    if (!ensureSupabase('Consensus')) return;
    try {
        const tableName = submissionType === 'generic' ? 'submission_validations' : 'validation_votes';
        const validatorCol = submissionType === 'generic' ? 'validator_id' : 'user_id';

        const { data: votes } = await supabase
            .from(tableName)
            .select(`vote, ${validatorCol}`)
            .eq('submission_id', submissionId);

        if (!votes || votes.length < MIN_VOTES_FOR_CONSENSUS) return;

        const total = votes.length;
        const approvals = votes.filter((v: any) => v.vote === 'approve').length;
        const approvalRate = approvals / total;
        const consensusScore = Math.round(approvalRate * 100);

        let newStatus: string | null = null;
        if (approvalRate >= APPROVE_THRESHOLD) {
            newStatus = 'approved';
        } else if (approvalRate <= REJECT_THRESHOLD) {
            newStatus = 'rejected';
        }

        if (newStatus) {
            const targetTable =
                submissionType === 'lexicon' ? 'lexicon_submissions' :
                    submissionType === 'rlhf' ? 'rlhf_submissions' : 'submissions';

            await supabase
                .from(targetTable)
                .update({ status: newStatus, validator_count: total, consensus_score: consensusScore })
                .eq('id', submissionId);

            // Reward each validator who voted on this submission
            const rewardInserts = votes.map((v: any) => ({
                user_id: v[validatorCol],
                type: 'earn',
                amount: VALIDATOR_REWARD,
                description: `Validation reward (${submissionType})`,
                reference_type: 'validation',
                reference_id: submissionId,
            }));
            await supabase.from('transactions').insert(rewardInserts);
        } else {
            // Not yet at consensus — update counts if possible
            const targetTable =
                submissionType === 'lexicon' ? 'lexicon_submissions' :
                    submissionType === 'rlhf' ? 'rlhf_submissions' : 'submissions';

            await supabase
                .from(targetTable)
                .update({ validator_count: total, consensus_score: consensusScore })
                .eq('id', submissionId);
        }
    } catch (err: any) {
        console.warn('[Consensus] Error:', err.message);
    }
}

// ============================================================================
// HELPERS
// ============================================================================

export function getValidatorReward(): number {
    return VALIDATOR_REWARD;
}

export async function getValidationStats(userId: string): Promise<ValidationStats> {
    if (!ensureSupabase('ValidationStats')) return { total: 0, accuracy: 0, rewardsEarned: 0 };
    try {
        const { data: validations } = await supabase
            .from('submission_validations')
            .select('vote')
            .eq('validator_id', userId);

        const total = validations?.length ?? 0;

        const { data: rewardTx } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'earn')
            .eq('reference_type', 'validation');

        const rewardsEarned = (rewardTx ?? []).reduce(
            (sum: number, t: any) => sum + Number(t.amount),
            0
        );

        return { total, accuracy: 0, rewardsEarned };
    } catch (err: any) {
        return { total: 0, accuracy: 0, rewardsEarned: 0 };
    }
}

/**
 * Count how many validations the user has submitted today.
 */
export async function getValidatedTodayCount(userId: string): Promise<number> {
    if (!ensureSupabase('TodayCount')) return 0;
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from('submission_validations')
            .select('id', { count: 'exact', head: true })
            .eq('validator_id', userId)
            .gte('created_at', startOfDay.toISOString());

        return count ?? 0;
    } catch {
        return 0;
    }
}
