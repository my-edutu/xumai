/**
 * XUM AI — Quality Scoring Service
 *
 * Provides pre-upload quality sanity checks for submissions:
 *   • Audio: SNR (Signal-to-Noise Ratio), Clarity, Silence detection
 *   • Image: Blur detection, NSFW check (placeholders for now)
 */

import * as FileSystem from 'expo-file-system/legacy';

// ============================================================================
// TYPES
// ============================================================================

export interface AudioQualityScore {
    snr: number;        // 0-100
    clarity: number;    // 0-100
    overall: number;    // 0-100
    isSilenced: boolean;
    analyzer: 'client_heuristic';
}

export interface ImageQualityScore {
    blur: number;       // 0-100
    nsfw: boolean;
    overall: number;    // 0-100
    analyzer: 'unavailable';
}

// ============================================================================
// AUDIO ANALYSIS (Heuristic)
// ============================================================================

/**
 * Analyzes audio quality.
 * NOTE: In a production environment, this would ideally use a native module 
 * or server-side analysis. This implementation uses file heuristics.
 */
export async function analyzeAudioQuality(uri: string): Promise<AudioQualityScore> {
    try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) throw new Error('File not found');

        const size = (info as any).size ?? 0;

        // 1. Silence / Short check
        // A typical high-quality 1s voice memo in m4a is ~15-30KB.
        // If it's < 2KB, it's likely silence or corrupted.
        const isSilenced = size < 2048;

        // 2. Deterministic client-side pre-check only. The authoritative
        // analyzer runs server-side after upload.
        let snr = 70;
        let clarity = 70;

        if (isSilenced) {
            snr = 10;
            clarity = 10;
        } else if (size < 10000) {
            // Very compressed or short
            snr -= 20;
            clarity -= 15;
        }

        const overall = (snr * 0.6) + (clarity * 0.4);

        return {
            snr: Math.round(snr),
            clarity: Math.round(clarity),
            overall: Math.round(overall),
            isSilenced,
            analyzer: 'client_heuristic'
        };
    } catch (err) {
        console.warn('[Quality] Audio analysis failed:', err);
        return { snr: 0, clarity: 0, overall: 0, isSilenced: true, analyzer: 'client_heuristic' };
    }
}

// ============================================================================
// IMAGE ANALYSIS (Heuristic)
// ============================================================================

/**
 * Analyzes image quality.
 */
export async function analyzeImageQuality(uri: string): Promise<ImageQualityScore> {
    // Do not report a passing image score without a real decoder/policy
    // analyzer. The server must replace this result after upload.
    try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || ((info as any).size ?? 0) === 0) {
            return { blur: 100, nsfw: false, overall: 0, analyzer: 'unavailable' };
        }
    } catch (err) {
        console.warn('[Quality] Image sanity check failed:', err);
    }
    return {
        blur: 100,
        nsfw: false,
        overall: 0,
        analyzer: 'unavailable'
    };
}

// ============================================================================
// AGGREGATE
// ============================================================================

export const QualityService = {
    analyzeAudioQuality,
    analyzeImageQuality
};

export default QualityService;
