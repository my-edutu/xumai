/**
 * Font Configuration
 * 
 * Loads Inter font family for the XUM AI application.
 * Inter is optimized for UI with excellent readability at all sizes.
 */

import { useFonts } from 'expo-font';

export function useAppFonts() {
    const [fontsLoaded] = useFonts({
        'Inter': require('../../assets/fonts/Inter_24pt-Regular.ttf'),
        'InterMedium': require('../../assets/fonts/Inter_24pt-Medium.ttf'),
        'InterSemiBold': require('../../assets/fonts/Inter_24pt-SemiBold.ttf'),
        'InterBold': require('../../assets/fonts/Inter_24pt-Bold.ttf'),
    });
    return fontsLoaded;
}

export const FONT_FAMILIES = {
    regular: 'Inter',
    medium: 'InterMedium',
    semibold: 'InterSemiBold',
    bold: 'InterBold',
} as const;
