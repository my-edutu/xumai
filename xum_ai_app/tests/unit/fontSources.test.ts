import assert from 'node:assert/strict';
import test from 'node:test';

import { getAppFontFamilyNames, getAppFontMap } from '../../src/config/fontSources';

test('web font map does not evaluate native asset requires', () => {
  assert.deepEqual(getAppFontMap('web'), {});
});

test('native font map exposes the four configured font families', () => {
  assert.deepEqual(getAppFontFamilyNames(), [
    'Inter',
    'InterBold',
    'InterMedium',
    'InterSemiBold',
  ]);
});
