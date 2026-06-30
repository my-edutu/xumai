/**
 * XUM AI — Quality Scoring Service
 *
 * Provides automated quality assessments for submissions:
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
}

export interface ImageQualityScore {
    blur: number;       // 0-100
    nsfw: boolean;
    overall: number;    // 0-100
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

        // 2. SNR & Clarity (Heuristic based on size/metadata)
        // This is a placeholder for actual FFT analysis.
        // We'll simulate a score based on a "normal" range.
        let snr = 75 + Math.random() * 20; // 75-95 base
        let clarity = 80 + Math.random() * 15; // 80-95 base

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
            isSilenced
        };
    } catch (err) {
        console.warn('[Quality] Audio analysis failed:', err);
        return { snr: 0, clarity: 0, overall: 0, isSilenced: true };
    }
}

// ============================================================================
// IMAGE ANALYSIS (Heuristic)
// ============================================================================

/**
 * Analyzes image quality.
 */
export async function analyzeImageQuality(uri: string): Promise<ImageQualityScore> {
    // Placeholder
    return {
        blur: 10, // low is good
        nsfw: false,
        overall: 90
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
