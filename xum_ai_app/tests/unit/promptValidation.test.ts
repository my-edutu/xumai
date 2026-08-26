import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizePromptGenerationParams } from '../../src/services/promptValidation';

test('normalizes prompt generation input for the server contract', () => {
  assert.deepEqual(normalizePromptGenerationParams({
    goal: ' Improve coverage ',
    context: ' Rural healthcare ',
    modality: 'voice',
    count: 100,
  }), {
    goal: 'Improve coverage',
    context: 'Rural healthcare',
    modality: 'voice',
    count: 50,
  });
});

test('rejects empty context and unsupported modalities', () => {
  assert.equal(normalizePromptGenerationParams({
    goal: 'Coverage',
    context: '   ',
    modality: 'voice',
    count: 10,
  }), null);

  assert.equal(normalizePromptGenerationParams({
    goal: 'Coverage',
    context: 'Healthcare',
    modality: 'audio' as 'voice',
    count: 10,
  }), null);
});
