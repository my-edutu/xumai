import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOtpInput, MAX_PHONE_DIGITS, normalizePhoneDigits, validateOptionalPhone } from '../../src/utils/authInput';

test('phone field allows typing digits and preserves national leading zeros', () => {
    let state = '';
    for (const character of '08031234567') state = normalizePhoneDigits(state + character);
    assert.equal(state, '08031234567');
    assert.ok(validateOptionalPhone(state));
});

test('phone field supports international clipboard input without nonnumeric characters', () => {
    assert.equal(normalizePhoneDigits('+234 (803) 123-4567'), '2348031234567');
    assert.equal(normalizePhoneDigits(' 0703 222 4444 '), '07032224444');
    assert.equal(normalizePhoneDigits('1'.repeat(30)).length, MAX_PHONE_DIGITS);
});

test('optional phone is optional but rejects incomplete values', () => {
    assert.equal(validateOptionalPhone(''), true);
    assert.equal(validateOptionalPhone('123'), false);
    assert.equal(validateOptionalPhone('08031234567'), true);
});

test('OTP accepts typing one digit at a time and advances to the next box', () => {
    let state = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
        const change = applyOtpInput(state, i, String(i + 1))!;
        state = change.digits;
        assert.equal(change.nextFocusIndex, Math.min(i + 1, 5));
    }
    assert.equal(state.join(''), '123456');
});

test('OTP accepts a six-digit paste and formatted SMS/autofill input', () => {
    const blank = ['', '', '', '', '', ''];
    assert.deepEqual(applyOtpInput(blank, 0, '123456'), {
        digits: ['1','2','3','4','5','6'],
        nextFocusIndex: 5,
    });
    assert.equal(applyOtpInput(blank, 0, '123 456')?.digits.join(''), '123456');
    assert.equal(applyOtpInput(blank, 4, '789012')?.digits.join(''), '7890');
});

test('OTP handles deletion and safely ignores letters and invalid positions', () => {
    const current = ['1','2','3','4','5','6'];
    assert.deepEqual(applyOtpInput(current, 2, ''), { digits: ['1','2','','4','5','6'], nextFocusIndex: 2 });
    assert.equal(applyOtpInput(current, 2, 'abc'), null);
    assert.equal(applyOtpInput(current, 9, '7'), null);
});
