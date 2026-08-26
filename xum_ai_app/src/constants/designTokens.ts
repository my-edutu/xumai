
/**
 * XUM AI Design System Tokens
 * 
 * This file contains the primitive values for the XUM AI design system.
 * It enforces consistency across the application by defining standard values
 * for spacing, typography, colors, and layout.
 */

// ============================================================================
// SPACING (8-point grid)
// ============================================================================
export const SPACING = {
    none: 0,
    xs: 4,    // 0.5x
    sm: 8,    // 1x
    md: 16,   // 2x
    lg: 24,   // 3x
    xl: 32,   // 4x
    xxl: 48,  // 6x
    xxxl: 64, // 8x
    huge: 80, // 10x
} as const;

// ============================================================================
// LAYOUT & SIZING
// ============================================================================
export const LAYOUT = {
    // Touch Targets (Min 44px for accessibility)
    touchTarget: 44,
    iconButton: 48,
    buttonHeight: 48,      // Inter-optimized
    inputHeight: 48,       // Inter-optimized

    // Navigation
    headerHeight: 64,
    bottomNavHeight: 72,

    // Border Radius (modern & clean)
    radius: {
        xs: 4,
        sm: 8,
        md: 12,      // Standard for buttons/inputs
        lg: 14,      // Cards
        xl: 24,
        xxl: 32,
        pill: 999,   // Fully rounded
        circle: 9999,
    },

    // Icons
    icon: {
        small: 16,
        medium: 24,  // Standard
        large: 32,
        xl: 48,
    }
} as const;

// ============================================================================
// TYPOGRAPHY (Inter-optimized)
// ============================================================================
export const TYPOGRAPHY = {
    // Font Families (Inter system)
    fonts: {
        regular: 'Inter',
        body: 'Inter',
        display: 'InterBold',
        medium: 'InterMedium',
        semibold: 'InterSemiBold',
        bold: 'InterBold',
    },

    // Font Sizes (Inter-optimized scale)
    size: {
        xs: 12,     // Caption
        sm: 14,     // Small
        md: 16,     // Body (standard)
        lg: 20,     // H3
        xl: 24,     // H2
        xxl: 32,    // H1
        display: 32,
    },

    // Line Heights (Inter-optimized)
    lineHeight: {
        xs: 16,     // Caption
        sm: 20,     // Small
        md: 24,     // Body
        lg: 28,     // H3
        xl: 32,     // H2
        xxl: 40,    // H1
    },

    // Font Weights
    weight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Letter Spacing (Inter-optimized)
    tracking: {
        tighter: -0.5,  // H1
        tight: -0.3,    // H2
        snug: -0.2,     // H3
        normal: 0,      // Body
        wide: 0.1,      // Small
        wider: 0.2,     // Buttons
        widest: 0.3,    // Caption
    }
} as const;

// ============================================================================
// SHADOWS (Elevation)
// ============================================================================
export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    // Softer, larger-radius elevation reads as premium depth on dark surfaces.
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
        elevation: 6,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.30,
        shadowRadius: 36,
        elevation: 12,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 12,
    })
} as const;

// ============================================================================
// COLORS (Primitives)
// ============================================================================
export const PALETTE = {
    // Base Blacks/Whites
    black: '#000000',
    white: '#FFFFFF',
    transparent: 'transparent',

    // Grays (Slate)
    gray: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
    },

    // Brand Colors (Vibrant/Neon)
    blue: {
        primary: '#1349ec',
        dark: '#0e36b5',
        light: '#3b6bff',
        subtle: 'rgba(19, 73, 236, 0.1)',
    },

    emerald: {
        primary: '#10b981',
        dark: '#059669',
        light: '#34d399',
    },

    orange: {
        primary: '#f97316',
        warning: '#f59e0b',
    },

    red: {
        error: '#ef4444',
        dark: '#b91c1c',
    },

    // Dark Mode Primitives
    dark: {
        bg: '#0a0d1d',       // Deep Blue/Black
        surface: '#12162a',  // Slightly Lighter
        border: '#1e2338',   // Border color
    }
} as const;

// ============================================================================
// PREDEFINED TEXT STYLES (Inter-optimized)
// ============================================================================
export const TEXT_STYLES = {
    // Headings
    h1: {
        fontSize: TYPOGRAPHY.size.xxl,           // 32px
        lineHeight: TYPOGRAPHY.lineHeight.xxl,   // 40px
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontFamily: TYPOGRAPHY.fonts.semibold,
        letterSpacing: TYPOGRAPHY.tracking.tighter, // -0.5
    },
    h2: {
        fontSize: TYPOGRAPHY.size.xl,            // 24px
        lineHeight: TYPOGRAPHY.lineHeight.xl,    // 32px
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontFamily: TYPOGRAPHY.fonts.semibold,
        letterSpacing: TYPOGRAPHY.tracking.tight,   // -0.3
    },
    h3: {
        fontSize: TYPOGRAPHY.size.lg,            // 20px
        lineHeight: TYPOGRAPHY.lineHeight.lg,    // 28px
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontFamily: TYPOGRAPHY.fonts.semibold,
        letterSpacing: TYPOGRAPHY.tracking.snug,    // -0.2
    },
    h4: {
        fontSize: TYPOGRAPHY.size.md,            // 16px
        lineHeight: TYPOGRAPHY.lineHeight.md,    // 24px
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontFamily: TYPOGRAPHY.fonts.semibold,
        letterSpacing: TYPOGRAPHY.tracking.normal,  // 0
    },
    h5: {
        fontSize: TYPOGRAPHY.size.sm,            // 14px
        lineHeight: TYPOGRAPHY.lineHeight.sm,    // 20px
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontFamily: TYPOGRAPHY.fonts.semibold,
        letterSpacing: TYPOGRAPHY.tracking.normal,  // 0
    },
    h6: {
        fontSize: TYPOGRAPHY.size.xs,            // 12px
        lineHeight: TYPOGRAPHY.lineHeight.xs,    // 16px
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontFamily: TYPOGRAPHY.fonts.semibold,
        letterSpacing: TYPOGRAPHY.tracking.widest, // 0.3
    },

    // Body Text
    bodyLarge: {
        fontSize: TYPOGRAPHY.size.md,            // 16px
        lineHeight: TYPOGRAPHY.lineHeight.md,    // 24px
        fontWeight: TYPOGRAPHY.weight.regular,
        fontFamily: TYPOGRAPHY.fonts.regular,
        letterSpacing: TYPOGRAPHY.tracking.normal,  // 0
    },
    body: {
        fontSize: TYPOGRAPHY.size.md,            // 16px
        lineHeight: TYPOGRAPHY.lineHeight.md,    // 24px
        fontWeight: TYPOGRAPHY.weight.regular,
        fontFamily: TYPOGRAPHY.fonts.regular,
        letterSpacing: TYPOGRAPHY.tracking.normal,  // 0
    },
    bodySmall: {
        fontSize: TYPOGRAPHY.size.sm,            // 14px
        lineHeight: TYPOGRAPHY.lineHeight.sm,    // 20px
        fontWeight: TYPOGRAPHY.weight.regular,
        fontFamily: TYPOGRAPHY.fonts.regular,
        letterSpacing: TYPOGRAPHY.tracking.wide,    // 0.1
    },

    // Labels & UI Text
    label: {
        fontSize: TYPOGRAPHY.size.sm,            // 14px
        lineHeight: TYPOGRAPHY.lineHeight.sm,    // 20px
        fontWeight: TYPOGRAPHY.weight.medium,
        fontFamily: TYPOGRAPHY.fonts.medium,
        letterSpacing: TYPOGRAPHY.tracking.wide,    // 0.1
    },
    labelSmall: {
        fontSize: TYPOGRAPHY.size.xs,            // 12px
        lineHeight: TYPOGRAPHY.lineHeight.xs,    // 16px
        fontWeight: TYPOGRAPHY.weight.medium,
        fontFamily: TYPOGRAPHY.fonts.medium,
        letterSpacing: TYPOGRAPHY.tracking.widest, // 0.3
    },
    caption: {
        fontSize: TYPOGRAPHY.size.xs,            // 12px
        lineHeight: TYPOGRAPHY.lineHeight.xs,    // 16px
        fontWeight: TYPOGRAPHY.weight.regular,
        fontFamily: TYPOGRAPHY.fonts.regular,
        letterSpacing: TYPOGRAPHY.tracking.widest, // 0.3
    },
    captionBold: {
        fontSize: TYPOGRAPHY.size.xs,            // 12px
        lineHeight: TYPOGRAPHY.lineHeight.xs,    // 16px
        fontWeight: TYPOGRAPHY.weight.bold,
        fontFamily: TYPOGRAPHY.fonts.bold,
        letterSpacing: TYPOGRAPHY.tracking.widest, // 0.3
        textTransform: 'uppercase' as const,
    },

    // Buttons (Inter-friendly)
    button: {
        fontSize: TYPOGRAPHY.size.md,            // 16px
        lineHeight: TYPOGRAPHY.lineHeight.md,    // 24px
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontFamily: TYPOGRAPHY.fonts.semibold,
        letterSpacing: TYPOGRAPHY.tracking.wider,  // 0.2
    },
    buttonLarge: {
        fontSize: TYPOGRAPHY.size.md,            // 16px
        lineHeight: TYPOGRAPHY.lineHeight.md,    // 24px
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontFamily: TYPOGRAPHY.fonts.semibold,
        letterSpacing: TYPOGRAPHY.tracking.wider,  // 0.2
    },

    // Monospace (kept for code)
    code: {
        fontSize: TYPOGRAPHY.size.xs,            // 12px
        lineHeight: TYPOGRAPHY.lineHeight.xs,    // 16px
        fontWeight: TYPOGRAPHY.weight.regular,
        fontFamily: TYPOGRAPHY.fonts.regular,
        letterSpacing: TYPOGRAPHY.tracking.normal,  // 0
    },
} as const;

// ============================================================================
// ANIMATIONS & TRANSITIONS
// ============================================================================
export const ANIMATION = {
    // Duration (in milliseconds)
    duration: {
        instant: 0,
        fast: 150,
        normal: 250,
        slow: 350,
        slower: 500,
    },

    // Easing Curves (for Animated.timing)
    easing: {
        // Use with react-native Easing
        linear: 'linear',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
    },
} as const;

// ============================================================================
// OPACITY SCALE
// ============================================================================
export const OPACITY = {
    transparent: 0,
    minimal: 0.05,
    subtle: 0.1,
    light: 0.2,
    medium: 0.4,
    strong: 0.6,
    heavy: 0.8,
    almostOpaque: 0.95,
    opaque: 1,
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================
export const Z_INDEX = {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
    max: 9999,
} as const;
