/**
 * Style Utilities
 * 
 * Helper functions for working with styles, colors, and themes
 */

import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';
import { ThemeColors } from '../context/ThemeContext';

/**
 * Convert hex color to rgba with opacity
 * @param hex - Hex color string (e.g., '#1349ec')
 * @param opacity - Opacity value between 0 and 1
 * @returns rgba string
 */
export function rgba(hex: string, opacity: number): string {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Convert hex color to RGB object
 * @param hex - Hex color string (e.g., '#1349ec')
 * @returns Object with r, g, b values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const sanitized = hex.replace('#', '');
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

/**
 * Determine if text should be light or dark based on background color
 * Uses WCAG contrast ratio calculation
 * @param bgColor - Background color hex string
 * @returns 'light' or 'dark'
 */
export function getContrastColor(bgColor: string): 'light' | 'dark' {
    const { r, g, b } = hexToRgb(bgColor);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? 'dark' : 'light';
}

/**
 * Create theme-aware styles with TypeScript support
 * @param createStyles - Function that takes theme and returns styles
 * @returns Memoized StyleSheet
 */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
    createStyles: (theme: ThemeColors) => T
) {
    return (theme: ThemeColors) => StyleSheet.create(createStyles(theme));
}

/**
 * Merge multiple style objects safely
 * Filters out falsy values for conditional styling
 */
export function mergeStyles<T extends ViewStyle | TextStyle | ImageStyle>(
    ...styles: (T | false | undefined | null)[]
): T {
    return Object.assign({}, ...styles.filter(Boolean)) as T;
}

/**
 * Create a glass morphism effect style
 * @param color - Base color for the glass effect
 * @param opacity - Opacity of the glass (default: 0.1)
 * @param blur - Blur intensity (note: requires expo-blur for actual blur)
 */
export function glassEffect(color: string, opacity: number = 0.1) {
    return {
        backgroundColor: rgba(color, opacity),
        borderWidth: 1,
        borderColor: rgba('#FFFFFF', 0.2),
    };
}
