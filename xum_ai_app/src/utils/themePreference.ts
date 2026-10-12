/**
 * First-time visitors use light mode. A stored explicit choice always wins.
 * This module is pure so theme selection can be regression-tested.
 */
import type { ThemeId } from '../context/ThemeContext';

export const DEFAULT_THEME_ID: ThemeId = 'light';

export function resolveThemePreference(
  savedTheme: string | null | undefined,
  availableThemes: Readonly<Record<ThemeId, unknown>>,
): ThemeId {
  return savedTheme && Object.prototype.hasOwnProperty.call(availableThemes, savedTheme)
    ? savedTheme as ThemeId
    : DEFAULT_THEME_ID;
}
