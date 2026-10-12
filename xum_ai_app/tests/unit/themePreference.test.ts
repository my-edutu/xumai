import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_THEME_ID, resolveThemePreference } from '../../src/utils/themePreference';

const available = { light: {}, midnight: {}, emerald: {}, solar: {}, amoled: {}, night: {}, crimson: {} };

test('light is the default for a first-time visitor', () => {
  assert.equal(DEFAULT_THEME_ID, 'light');
  assert.equal(resolveThemePreference(null, available), 'light');
  assert.equal(resolveThemePreference(undefined, available), 'light');
});

test('explicit dark or light preference survives refresh', () => {
  assert.equal(resolveThemePreference('midnight', available), 'midnight');
  assert.equal(resolveThemePreference('amoled', available), 'amoled');
  assert.equal(resolveThemePreference('light', available), 'light');
});

test('stale and invalid saved values fall back to light safely', () => {
  assert.equal(resolveThemePreference('outdated', available), 'light');
  assert.equal(resolveThemePreference('__proto__', available), 'light');
  assert.equal(resolveThemePreference('', available), 'light');
});
