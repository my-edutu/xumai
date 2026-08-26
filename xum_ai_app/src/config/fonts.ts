/**
 * Font Configuration
 * 
 * Loads Inter font family for the XUM AI application.
 * Inter is optimized for UI with excellent readability at all sizes.
 */

import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

import { getAppFontMap } from './fontSources';

export function useAppFonts() {
    const platform = Platform.OS === 'web' ? 'web' : 'native';
    const [fontsLoaded] = useFonts(getAppFontMap(platform));

    // The web shell loads Inter through CSS; do not wait for native TTF
    // resolution in a browser where CommonJS asset loading is unavailable.
    return platform === 'web' || fontsLoaded;
}

export const FONT_FAMILIES = {
    regular: 'Inter',
    medium: 'InterMedium',
    semibold: 'InterSemiBold',
    bold: 'InterBold',
} as const;
