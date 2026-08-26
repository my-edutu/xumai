import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidOtp } from '../../src/services/otp';

test('OTP validation accepts exactly six digits', () => {
  assert.equal(isValidOtp('123456'), true);
  assert.equal(isValidOtp('12345'), false);
  assert.equal(isValidOtp('1234567'), false);
  assert.equal(isValidOtp('12a456'), false);
});
