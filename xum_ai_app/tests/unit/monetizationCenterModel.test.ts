import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyMonetizationSnapshot, parseMonetizationSnapshot } from '../../src/services/monetizationCenterModel';

test('disabled backend displays no synthetic progress and never enables withdrawals', () => {
  const result = parseMonetizationSnapshot({ status: 'eligible', reason: 'PROGRAM_DISABLED',
    program_available: false, checks: [{ requirement: 'email_verified', passed: true }] });
  assert.equal(result.status, 'not_monetized');
  assert.equal(result.progressPercent, null);
  assert.deepEqual(result.checks, []);
  assert.equal(result.canWithdraw, false);
});

test('missing and malformed responses fail closed', () => {
  assert.equal(parseMonetizationSnapshot(null).reason, 'INVALID_RESPONSE');
  assert.equal(parseMonetizationSnapshot([]).programAvailable, false);
  assert.deepEqual(emptyMonetizationSnapshot().unmet, []);
});

test('trusted server assessment renders explicit passed and unmet requirements', () => {
  const result = parseMonetizationSnapshot({
    program_available: true, reason: 'ASSESSED', status: 'not_monetized',
    checked_at: '2026-10-13T10:00:00Z', policy_version_id: 'policy-test',
    checks: [
      { requirement: 'email_verified', passed: true, observed: true, target: true },
      { requirement: 'qualification_accuracy', passed: false, observed: 77, target: 80 },
    ],
  });
  assert.equal(result.progressPercent, 50);
  assert.deepEqual(result.unmet, ['qualification_accuracy']);
  assert.equal(result.checkedAt, '2026-10-13T10:00:00Z');
  assert.equal(result.canWithdraw, false);
});

test('server eligibility does not grant client payment permission', () => {
  const result = parseMonetizationSnapshot({
    program_available: true, reason: 'ASSESSED', status: 'eligible', can_withdraw: true,
    checks: [{ requirement: 'email_verified', passed: true, observed: true, target: true }],
  });
  assert.equal(result.status, 'eligible');
  assert.equal(result.canWithdraw, false);
});

test('unknown, duplicate and malformed checklist rows cannot inflate progress', () => {
  const result = parseMonetizationSnapshot({
    program_available: true, reason: 'ASSESSED', status: 'eligible',
    checks: [
      { requirement: 'email_verified', passed: true },
      { requirement: 'email_verified', passed: true },
      { requirement: '__proto__', passed: true },
      { requirement: 'qualification_tasks', passed: false, observed: 4, target: 10 },
    ],
  });
  assert.equal(result.progressPercent, 50);
  assert.equal(result.status, 'not_monetized');
  assert.equal(result.checks.length, 2);
});
