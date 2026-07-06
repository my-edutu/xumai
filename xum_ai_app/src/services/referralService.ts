/**
 * XUM AI — Referral Service
 *
 * Owns the client side of the referral loop:
 *  - deriving a user's shareable code (single source of truth for the UI)
 *  - capturing an incoming `?ref=` code (web deep link) or manual entry
 *  - persisting a pending code across the sign-up + verification flow
 *  - applying it (via the apply_referral RPC) once the user exists
 *
 * The reward payout itself is handled server-side by the
 * credit_referral_reward trigger (see docs/sql/referral_system_migration.sql).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const PENDING_CODE_KEY = 'pending_referral_code';

/** Base reward shown to users before server confirmation. */
export const REFERRAL_BASE_REWARD = 2.0;

/**
 * Derive a user's referral code from their id.
 * MUST stay in sync with apply_referral() in the SQL migration:
 * 'XUM-' + last 8 chars of the id (dashes stripped, uppercased).
 */
export function deriveReferralCode(userId?: string | null): string {
    if (!userId) return 'XUM-LOADING';
    return `XUM-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;
}

/** Build the shareable join link for a code. */
export function referralLinkFor(code: string): string {
    return `https://xum.ai/join?ref=${code}`;
}

/**
 * Normalize any user/URL-supplied code into the canonical `XUM-XXXXXXXX`
 * form. Accepts a raw suffix, a full code, or a pasted join URL.
 * Returns null if it can't produce a valid 8-char suffix.
 */
export function normalizeReferralCode(raw?: string | null): string | null {
    if (!raw) return null;
    let value = raw.trim();

    // Pull the ref param out of a pasted URL if present.
    const urlMatch = value.match(/[?&]ref=([^&\s]+)/i);
    if (urlMatch) value = urlMatch[1];

    const alnum = value.replace(/[^a-zA-Z0-9]/g, '');
    if (alnum.length < 8) return null;

    // The meaningful part is always the trailing 8 chars (drops 'XUM').
    return `XUM-${alnum.slice(-8).toUpperCase()}`;
}

/** Read an incoming referral code from the web URL (`?ref=`), if any. */
export function captureReferralFromUrl(): string | null {
    if (Platform.OS !== 'web') return null;
    try {
        // eslint-disable-next-line no-undef
        const search = typeof window !== 'undefined' ? window.location?.search : '';
        if (!search) return null;
        const params = new URLSearchParams(search);
        return normalizeReferralCode(params.get('ref'));
    } catch {
        return null;
    }
}

export async function storePendingReferralCode(code: string): Promise<void> {
    const normalized = normalizeReferralCode(code);
    if (!normalized) return;
    try {
        await AsyncStorage.setItem(PENDING_CODE_KEY, normalized);
    } catch {
        /* non-fatal */
    }
}

export async function getPendingReferralCode(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(PENDING_CODE_KEY);
    } catch {
        return null;
    }
}

export async function clearPendingReferralCode(): Promise<void> {
    try {
        await AsyncStorage.removeItem(PENDING_CODE_KEY);
    } catch {
        /* non-fatal */
    }
}

/**
 * Apply any pending referral code for a freshly-synced user.
 * Idempotent and best-effort — safe to call on every sync; the RPC
 * skips users who are already referred and clears the code on a
 * definitive outcome so it isn't retried forever.
 */
export async function applyPendingReferral(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !userId) return;

    const code = await getPendingReferralCode();
    if (!code) return;

    // Don't let a user refer themselves.
    if (normalizeReferralCode(code) === deriveReferralCode(userId)) {
        await clearPendingReferralCode();
        return;
    }

    try {
        const { data, error } = await supabase.rpc('apply_referral', {
            p_code: code,
            p_referred_id: userId,
        });

        if (error) {
            // Transient (e.g. session not attached yet) — keep the code
            // so the next sync can retry.
            console.warn('[Referral] apply_referral failed, will retry:', error.message);
            return;
        }

        const status = (data as any)?.status;
        const reason = (data as any)?.reason;

        if (status === 'ok' || status === 'skipped') {
            await clearPendingReferralCode();
            console.log('[Referral] Applied:', status, reason ?? '');
        } else if (reason === 'referrer_not_found' || reason === 'bad_code') {
            // Won't ever succeed — stop retrying.
            await clearPendingReferralCode();
            console.log('[Referral] Discarded invalid code:', reason);
        } else {
            // 'no_user' or unknown — leave the code for a retry.
            console.log('[Referral] Deferred:', reason ?? status);
        }
    } catch (err: any) {
        console.warn('[Referral] apply_referral exception:', err?.message);
    }
}
