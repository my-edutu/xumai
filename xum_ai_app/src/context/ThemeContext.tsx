import React from 'react';
import { PALETTE, SPACING, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/designTokens';

export interface ThemeColors {
    // Core Brand
    primary: string;
    primaryDark: string;
    primaryLight: string;

    // UI Structure
    background: string;
    surface: string;
    surfaceHighlight: string; // New: slightly lighter surface
    border: string;

    // Typography Colors
    text: string;
    textSecondary: string;
    textTertiary: string; // New: low contrast text
    textInverse: string; // New: text on primary button

    // Semantic
    success: string;
    warning: string;
    error: string;
    info: string;

    // Accent (Themable)
    accent: string;

    // Functional
    overlay: string;
    shadow: string;
}

export type ThemeId = 'midnight' | 'emerald' | 'solar' | 'amoled' | 'night' | 'crimson' | 'light';

// Common Values
const DARK_BG = PALETTE.dark.bg;
const DARK_SURFACE = PALETTE.dark.surface;
const DARK_BORDER = PALETTE.dark.border;

const LIGHT_BG = PALETTE.gray[50];
const LIGHT_SURFACE = PALETTE.white;
const LIGHT_BORDER = PALETTE.gray[200];

export const themePresets: Record<ThemeId, ThemeColors> = {
    midnight: {
        primary: PALETTE.blue.primary,
        primaryDark: PALETTE.blue.dark,
        primaryLight: PALETTE.blue.light,
        background: DARK_BG,
        surface: DARK_SURFACE,
        surfaceHighlight: '#1a1f35',
        border: DARK_BORDER,
        text: PALETTE.white,
        textSecondary: PALETTE.gray[400],
        textTertiary: PALETTE.gray[600],
        textInverse: PALETTE.white,
        success: PALETTE.emerald.primary,
        warning: PALETTE.orange.warning,
        error: PALETTE.red.error,
        info: PALETTE.blue.light,
        accent: PALETTE.blue.primary,
        overlay: 'rgba(0,0,0,0.7)',
        shadow: '#000000',
    },
    emerald: {
        primary: PALETTE.emerald.primary,
        primaryDark: PALETTE.emerald.dark,
        primaryLight: PALETTE.emerald.light,
        background: DARK_BG,
        surface: DARK_SURFACE,
        surfaceHighlight: '#1a1f35',
        border: DARK_BORDER,
        text: PALETTE.white,
        textSecondary: PALETTE.gray[400],
        textTertiary: PALETTE.gray[600],
        textInverse: PALETTE.white,
        success: PALETTE.emerald.primary,
        warning: PALETTE.orange.warning,
        error: PALETTE.red.error,
        info: PALETTE.blue.light,
        accent: PALETTE.emerald.primary,
        overlay: 'rgba(0,0,0,0.7)',
        shadow: '#000000',
    },
    solar: {
        primary: PALETTE.orange.warning,
        primaryDark: '#d97706',
        primaryLight: '#fbbf24',
        background: DARK_BG,
        surface: DARK_SURFACE,
        surfaceHighlight: '#1a1f35',
        border: DARK_BORDER,
        text: PALETTE.white,
        textSecondary: PALETTE.gray[400],
        textTertiary: PALETTE.gray[600],
        textInverse: PALETTE.black, // Dark text on yellow button
        success: PALETTE.emerald.primary,
        warning: PALETTE.orange.warning,
        error: PALETTE.red.error,
        info: PALETTE.blue.light,
        accent: PALETTE.orange.warning,
        overlay: 'rgba(0,0,0,0.7)',
        shadow: '#000000',
    },
    amoled: {
        primary: '#6366f1',
        primaryDark: '#4f46e5',
        primaryLight: '#818cf8',
        background: '#000000', // Pure black
        surface: '#0a0a0a',
        surfaceHighlight: '#111111',
        border: '#1a1a1a',
        text: PALETTE.white,
        textSecondary: PALETTE.gray[400],
        textTertiary: PALETTE.gray[700],
        textInverse: PALETTE.white,
        success: PALETTE.emerald.primary,
        warning: PALETTE.orange.warning,
        error: PALETTE.red.error,
        info: PALETTE.blue.light,
        accent: '#6366f1',
        overlay: 'rgba(0,0,0,0.8)',
        shadow: '#000000',
    },
    night: {
        primary: '#8b5cf6',
        primaryDark: '#7c3aed',
        primaryLight: '#a78bfa',
        background: DARK_BG,
        surface: DARK_SURFACE,
        surfaceHighlight: '#1a1f35',
        border: DARK_BORDER,
        text: '#f1f5f9',
        textSecondary: PALETTE.gray[400],
        textTertiary: PALETTE.gray[600],
        textInverse: PALETTE.white,
        success: PALETTE.emerald.primary,
        warning: PALETTE.orange.warning,
        error: PALETTE.red.error,
        info: PALETTE.blue.light,
        accent: '#8b5cf6',
        overlay: 'rgba(0,0,0,0.7)',
        shadow: '#000000',
    },
    crimson: {
        primary: PALETTE.red.error,
        primaryDark: PALETTE.red.dark,
        primaryLight: '#fb7185',
        background: DARK_BG,
        surface: DARK_SURFACE,
        surfaceHighlight: '#1a1f35',
        border: DARK_BORDER,
        text: PALETTE.white,
        textSecondary: PALETTE.gray[400],
        textTertiary: PALETTE.gray[600],
        textInverse: PALETTE.white,
        success: PALETTE.emerald.primary,
        warning: PALETTE.orange.warning,
        error: PALETTE.red.error,
        info: PALETTE.blue.light,
        accent: PALETTE.red.error,
        overlay: 'rgba(0,0,0,0.7)',
        shadow: '#000000',
    },
    light: {
        primary: PALETTE.blue.primary,
        primaryDark: PALETTE.blue.dark,
        primaryLight: PALETTE.blue.light,
        background: LIGHT_BG,
        surface: LIGHT_SURFACE,
        surfaceHighlight: PALETTE.white,
        border: LIGHT_BORDER,
        text: PALETTE.gray[900],
        textSecondary: PALETTE.gray[500],
        textTertiary: PALETTE.gray[400],
        textInverse: PALETTE.white,
        success: PALETTE.emerald.primary,
        warning: PALETTE.orange.warning,
        error: PALETTE.red.error,
        info: PALETTE.blue.primary,
        accent: PALETTE.blue.primary,
        overlay: 'rgba(0,0,0,0.3)',
        shadow: '#cbd5e1',
    },
};

export interface ThemeContextType {
    theme: ThemeColors;
    themeId: ThemeId;
    setTheme: (id: ThemeId) => void;
    tokens: {
        spacing: typeof SPACING;
        typography: typeof TYPOGRAPHY;
        layout: typeof LAYOUT;
        shadows: typeof SHADOWS;
    };
}

// Initial context with default values
export const ThemeContext = React.createContext<ThemeContextType>({
    theme: themePresets.midnight,
    themeId: 'midnight',
    setTheme: () => { },
    tokens: {
        spacing: SPACING,
        typography: TYPOGRAPHY,
        layout: LAYOUT,
        shadows: SHADOWS,
    }
});

export const useTheme = () => React.useContext(ThemeContext);
