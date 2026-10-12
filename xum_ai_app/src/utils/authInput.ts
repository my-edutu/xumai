/**
 * Shared input rules for the contributor onboarding / authentication flow.
 * Keep these pure so keyboard and paste handling can be regression-tested.
 */
export const MAX_PHONE_DIGITS = 15;

export function normalizePhoneDigits(value: string): string {
    // Keep national-format leading zeros. Country dial code is stored separately.
    // Accept copy/paste of +234 (800) 123-4567 without inserting formatting on every keystroke.
    return value.replace(/[^0-9]/g, '').slice(0, MAX_PHONE_DIGITS);
}

/** Phone is optional on this form; reject an incomplete value rather than discarding it. */
export function validateOptionalPhone(value: string): boolean {
    const digits = normalizePhoneDigits(value);
    return digits.length === 0 || (digits.length >= 7 && digits.length <= MAX_PHONE_DIGITS);
}

export interface OtpInputResult {
    digits: string[];
    nextFocusIndex: number;
}

/**
 * Handles both individual keypresses and a complete code pasted/autofilled
 * into any OTP box. Returning null ignores nonnumeric keystrokes.
 */
export function applyOtpInput(current: readonly string[], index: number, input: string): OtpInputResult | null {
    if (index < 0 || index >= current.length) return null;
    const digits = input.replace(/[^0-9]/g, '');
    if (input.length && !digits.length) return null;
    const next = [...current];
    if (!digits.length) {
        next[index] = '';
        return { digits: next, nextFocusIndex: index };
    }
    const accepted = digits.slice(0, current.length - index);
    for (let i = 0; i < accepted.length; i++) {
        next[index + i] = accepted[i];
    }
    return {
        digits: next,
        nextFocusIndex: Math.min(index + accepted.length, current.length - 1),
    };
}
