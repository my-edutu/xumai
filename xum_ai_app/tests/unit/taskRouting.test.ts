import test from 'node:test';
import assert from 'node:assert/strict';
import { ScreenName } from '../../src/types';
import {
    CANONICAL_SCREEN_NAMES,
    getTaskScreen,
    normalizeScreen,
} from '../../src/navigation/taskRouting';

test('maps every supported task type to an implemented contributor screen', () => {
    assert.equal(getTaskScreen('voice'), ScreenName.VOICE_TASK);
    assert.equal(getTaskScreen('image'), ScreenName.IMAGE_TASK);
    assert.equal(getTaskScreen('video'), ScreenName.VIDEO_TASK);
    assert.equal(getTaskScreen('text'), ScreenName.LINGUASENSE_ENGINE);
    assert.equal(getTaskScreen('validation'), ScreenName.VALIDATION_TASK_EXECUTION);
});

test('normalizes legacy task targets instead of sending users to an empty route', () => {
    assert.equal(normalizeScreen('TASK_DETAILS', 'image'), ScreenName.IMAGE_TASK);
    assert.equal(normalizeScreen('CAPTURE_AUDIO'), ScreenName.VOICE_TASK);
    assert.equal(normalizeScreen('MEDIA_CAPTURE'), ScreenName.IMAGE_TASK);
    assert.equal(normalizeScreen('CAPTURE_VIDEO'), ScreenName.VIDEO_TASK);
    assert.equal(normalizeScreen('CAPTURE_CHOICE'), ScreenName.ENVIRONMENTAL_SENSING);
    assert.equal(normalizeScreen('TEXT_INPUT_TASK'), ScreenName.LINGUASENSE_ENGINE);
    assert.equal(normalizeScreen('VALIDATION_TASK'), ScreenName.VALIDATION_TASK_EXECUTION);
    assert.equal(normalizeScreen('TASK_SUCCESS'), ScreenName.HOME);
});

test('canonical route registry includes every current task destination', () => {
    for (const screen of [
        ScreenName.TASK_MARKETPLACE,
        ScreenName.LINGUASENSE_ENGINE,
        ScreenName.LINGUASENSE,
        ScreenName.VOICE_TASK,
        ScreenName.IMAGE_TASK,
        ScreenName.VIDEO_TASK,
        ScreenName.VALIDATION_TASK_EXECUTION,
        ScreenName.LEXICON_TASK,
        ScreenName.RLHF_CORRECTION,
        ScreenName.SAFETY_SCORING,
        ScreenName.CULTURAL_APPROPRIATENESS,
    ]) {
        assert.ok(CANONICAL_SCREEN_NAMES.has(screen), `${screen} is missing from the canonical route registry`);
    }
});
