export interface AuthLayoutMetrics {
    horizontalPadding: number;
    contentMaxWidth: number;
    headerHeight: number;
    buttonHeight: number;
    isCompact: boolean;
}

export const AUTH_FONT_WEIGHTS = {
    title: '700',
    button: '600',
    label: '500',
    link: '600',
} as const;

const clamp = (value: number, minimum: number, maximum: number): number =>
    Math.min(Math.max(value, minimum), maximum);

/**
 * Calculate responsive measurements for the contributor auth screen.
 * Keeps content comfortable on phones without allowing buttons to stretch
 * excessively on tablets and desktop web.
 */
export const getAuthLayoutMetrics = (width: number, height: number): AuthLayoutMetrics => ({
    horizontalPadding: Math.round(clamp(width * 0.06, 20, 48)),
    contentMaxWidth: Math.min(width, 600),
    headerHeight: Math.round(clamp(height * 0.35, 220, 320)),
    buttonHeight: width < 360 ? 56 : 60,
    isCompact: width < 480,
});
