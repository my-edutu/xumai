import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_FONT_WEIGHTS, getAuthLayoutMetrics } from '../../src/utils/authLayout';

test('uses compact spacing and smaller buttons on narrow phones', () => {
    assert.deepEqual(getAuthLayoutMetrics(320, 640), {
        horizontalPadding: 20,
        contentMaxWidth: 320,
        headerHeight: 224,
        buttonHeight: 56,
        isCompact: true,
    });
});

test('caps the auth card and keeps comfortable button sizing on wide screens', () => {
    assert.deepEqual(getAuthLayoutMetrics(1440, 900), {
        horizontalPadding: 48,
        contentMaxWidth: 600,
        headerHeight: 315,
        buttonHeight: 60,
        isCompact: false,
    });
});

test('uses readable weights for entry-flow controls', () => {
    assert.deepEqual(AUTH_FONT_WEIGHTS, {
        title: '700',
        button: '600',
        label: '500',
        link: '600',
    });
});
