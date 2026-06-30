/**
 * XUM AI — Pre-Check Service
 *
 * Validates media files before upload:
 *   • File size limits
 *   • Duration limits
 *   • Hash-based duplicate detection (via Supabase duplicate_hashes table)
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';
import { QualityService } from './qualityService';

// ============================================================================
// LIMITS
// ============================================================================

const SIZE_LIMITS_BYTES: Record<string, number> = {
    image: 15 * 1024 * 1024,  // 15 MB
    voice: 10 * 1024 * 1024,  // 10 MB
    video: 100 * 1024 * 1024, // 100 MB
};

const DURATION_LIMITS_SECONDS: Record<string, number> = {
    voice: 60,   // 60 s
    video: 120,  // 120 s
};

// ============================================================================
// TYPES
// ============================================================================

export interface PreCheckResult {
    passed: boolean;
    flags: string[];
    warnings: string[];
}

// ============================================================================
// HELPERS
// ============================================================================

/** Lightweight djb2 hash over a string — no native deps needed */
function djb2Hash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // keep 32-bit
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

/** Build a content fingerprint from the first ~4 KB of a base64 string */
function buildFingerprint(userId: string, sampleBase64: string, fileSize: number): string {
    const sample = sampleBase64.substring(0, 4096);
    return djb2Hash(`${userId}:${fileSize}:${sample}`);
}

// ============================================================================
// MAIN
// ============================================================================

/**
 * Run all pre-submission checks on a media file.
 *
 * @param fileUri         Local file URI (e.g. from expo-image-picker or audio recording)
 * @param taskType        'voice' | 'image' | 'video'
 * @param userId          Clerk / Supabase user ID
 * @param fileSizeBytes   Optional; if omitted the service will stat the file.
 * @param durationSeconds Optional; used for duration-limit checks.
 * @returns PreCheckResult  { passed, flags, warnings }
 */
export async function runPreCheck(
    fileUri: string,
    taskType: 'voice' | 'image' | 'video',
    userId: string,
    fileSizeBytes?: number,
    durationSeconds?: number
): Promise<PreCheckResult> {
    const flags: string[] = [];
    const warnings: string[] = [];

    try {
        // ── 1. File existence & size ─────────────────────────────────────────
        let fileSize = fileSizeBytes;
        let resolvedSize: number;
        if (fileSize !== undefined) {
            resolvedSize = fileSize;
        } else {
            const info = await FileSystem.getInfoAsync(fileUri);
            if (!info.exists) {
                flags.push('File not found or inaccessible');
                return { passed: false, flags, warnings };
            }
            resolvedSize = (info as any).size ?? 0;
        }

        // ── 2. Size limits ───────────────────────────────────────────────────
        const sizeLimit = SIZE_LIMITS_BYTES[taskType];
        if (sizeLimit !== undefined && resolvedSize > sizeLimit) {
            const mb = (resolvedSize / 1024 / 1024).toFixed(1);
            const limitMb = (sizeLimit / 1024 / 1024).toFixed(0);
            flags.push(`File too large (${mb} MB > ${limitMb} MB limit)`);
        }

        // ── 3. Duration limits ───────────────────────────────────────────────
        if (durationSeconds !== undefined) {
            const durationLimit = DURATION_LIMITS_SECONDS[taskType];
            if (durationLimit !== undefined && durationSeconds > durationLimit) {
                flags.push(`Recording too long (${durationSeconds}s > ${durationLimit}s limit)`);
            }
        }

        // ── 4. Duplicate check ───────────────────────────────────────────────
        if (isSupabaseConfigured) {
            try {
                const base64 = await FileSystem.readAsStringAsync(fileUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                const fingerprint = buildFingerprint(userId, base64, resolvedSize);

                const { data: existing } = await supabase
                    .from('duplicate_hashes')
                    .select('id')
                    .eq('hash', fingerprint)
                    .eq('user_id', userId)
                    .maybeSingle();

                if (existing) {
                    flags.push('Duplicate submission detected — this file was already submitted');
                } else {
                    // Store fingerprint for future checks (fire-and-forget)
                    void supabase
                        .from('duplicate_hashes')
                        .insert({ hash: fingerprint, user_id: userId, task_type: taskType });
                }
            } catch (_) {
                warnings.push('Could not verify for duplicates — proceeding anyway');
            }
        }

        // ── 5. Quality scoring (SNR / Clarity) ──────────────────────────────
        if (taskType === 'voice') {
            try {
                const quality = await QualityService.analyzeAudioQuality(fileUri);
                if (quality.isSilenced) {
                    flags.push('Low quality: Silent or very quiet recording detected');
                } else if (quality.overall < 40) {
                    warnings.push('Low clarity: This recording might be hard to understand');
                }

                // Attach quality metrics to warnings (just for logging/visibility in UI)
                warnings.push(`Metrics: SNR ${quality.snr}, Clarity ${quality.clarity}`);
            } catch (_) {
                warnings.push('Could not complete audio quality analysis');
            }
        }

        return { passed: flags.length === 0, flags, warnings };
    } catch (err: any) {
        // Never block a submission due to a pre-check crash
        return {
            passed: true,
            flags: [],
            warnings: [`Pre-check could not complete: ${err?.message ?? 'unknown error'}`],
        };
    }
}
