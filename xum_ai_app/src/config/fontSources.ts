/**
 * Platform-aware font sources.
 *
 * Web uses the Inter CSS font loaded by the web shell. Native builds load the
 * bundled TTF files through Metro's asset resolver.
 */

import type { FontSource } from 'expo-font';

export type AppFontPlatform = 'web' | 'native';

const APP_FONT_FAMILY_NAMES = ['Inter', 'InterBold', 'InterMedium', 'InterSemiBold'] as const;

export function getAppFontFamilyNames(): readonly string[] {
  return APP_FONT_FAMILY_NAMES;
}

export function getAppFontMap(platform: AppFontPlatform): Record<string, FontSource> {
  if (platform === 'web') {
    return {};
  }

  return {
    Inter: require('../../assets/fonts/Inter_24pt-Regular.ttf'),
    InterMedium: require('../../assets/fonts/Inter_24pt-Medium.ttf'),
    InterSemiBold: require('../../assets/fonts/Inter_24pt-SemiBold.ttf'),
    InterBold: require('../../assets/fonts/Inter_24pt-Bold.ttf'),
  };
}
