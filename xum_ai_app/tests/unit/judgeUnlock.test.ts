import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeJudgeUnlockStats } from '../../src/services/judgeUnlock';

test('normalizes the server unlock response without inventing a threshold', () => {
  assert.deepEqual(normalizeJudgeUnlockStats({
    is_unlocked: true,
    completed_tasks: 14,
    required_tasks: 12,
  }), {
    isUnlocked: true,
    completedTasks: 14,
    requiredTasks: 12,
  });
});

test('fails closed when the unlock response is missing or invalid', () => {
  assert.deepEqual(normalizeJudgeUnlockStats(null), {
    isUnlocked: false,
    completedTasks: 0,
    requiredTasks: 0,
  });

  assert.deepEqual(normalizeJudgeUnlockStats({ required_tasks: -1 }), {
    isUnlocked: false,
    completedTasks: 0,
    requiredTasks: 0,
  });
});
