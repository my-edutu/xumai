import { ScreenName } from '../types';

/** Screens currently rendered by the canonical Expo app. */
export const CANONICAL_SCREEN_NAMES = new Set<ScreenName>([
    ScreenName.SPLASH,
    ScreenName.ONBOARDING,
    ScreenName.AUTH,
    ScreenName.FORGOT_PASSWORD,
    ScreenName.OTP_VERIFICATION,
    ScreenName.ACCOUNT_TYPE_SELECT,
    ScreenName.SKILL_SETUP,
    ScreenName.LANGUAGE_SELECTION,
    ScreenName.TASK_INTERESTS,
    ScreenName.COMPANY_DASHBOARD,
    ScreenName.HOME,
    ScreenName.WALLET,
    ScreenName.SETTINGS,
    ScreenName.PROFILE,
    ScreenName.PAYMENT_METHODS,
    ScreenName.EDIT_PROFILE,
    ScreenName.LEADERBOARD,
    ScreenName.XUM_JUDGE,
    ScreenName.TASK_MARKETPLACE,
    ScreenName.ENVIRONMENTAL_SENSING,
    ScreenName.LINGUASENSE_ENGINE,
    ScreenName.LINGUASENSE,
    ScreenName.LANGUAGE_RUNNER,
    ScreenName.VOICE_TASK,
    ScreenName.IMAGE_TASK,
    ScreenName.VIDEO_TASK,
    ScreenName.NOTIFICATIONS,
    ScreenName.RECORDS,
    ScreenName.SUPPORT,
    ScreenName.APPEARANCE_LABS,
    ScreenName.ADMIN_LOGIN,
    ScreenName.ADMIN_DASHBOARD,
    ScreenName.ADMIN_USER_MANAGEMENT,
    ScreenName.ADMIN_TASK_MODERATION,
    ScreenName.ADMIN_PAYOUTS,
    ScreenName.ADMIN_CAMPAIGNS,
    ScreenName.ADMIN_AUDIT_LOGS,
    ScreenName.ADMIN_FRAUD_DETECTION,
    ScreenName.ADMIN_SESSIONS,
    ScreenName.ADMIN_LEXICON,
    ScreenName.ADMIN_MARKETPLACE_MANAGEMENT,
    ScreenName.VALIDATION_TASK_EXECUTION,
    ScreenName.RLHF_CORRECTION,
    ScreenName.SAFETY_SCORING,
    ScreenName.CULTURAL_APPROPRIATENESS,
    ScreenName.LEXICON_TASK,
    ScreenName.REFERRALS,
    ScreenName.SUBMISSION_TRACKER,
    ScreenName.SUBMISSION_VALIDATION,
    ScreenName.PROMPT_GENIUS,
    ScreenName.GAP_DASHBOARD,
    ScreenName.DATA_SALES,
]);

const TASK_SCREEN_BY_TYPE: Record<string, ScreenName> = {
    audio: ScreenName.VOICE_TASK,
    voice: ScreenName.VOICE_TASK,
    image: ScreenName.IMAGE_TASK,
    photo: ScreenName.IMAGE_TASK,
    video: ScreenName.VIDEO_TASK,
    text: ScreenName.LINGUASENSE_ENGINE,
    translation: ScreenName.LINGUASENSE_ENGINE,
    linguasense: ScreenName.LINGUASENSE,
    validation: ScreenName.VALIDATION_TASK_EXECUTION,
    rlhf: ScreenName.RLHF_CORRECTION,
    lexicon: ScreenName.LEXICON_TASK,
    safety: ScreenName.SAFETY_SCORING,
    cultural: ScreenName.CULTURAL_APPROPRIATENESS,
};

const LEGACY_SCREEN_ALIASES: Record<string, ScreenName> = {
    TASK_DETAILS: ScreenName.TASK_MARKETPLACE,
    TASK_SUBMISSION: ScreenName.SUBMISSION_TRACKER,
    WITHDRAW: ScreenName.WALLET,
    CREATE_TASK: ScreenName.ENVIRONMENTAL_SENSING,
    CAPTURE_CHOICE: ScreenName.ENVIRONMENTAL_SENSING,
    CAPTURE_AUDIO: ScreenName.VOICE_TASK,
    MEDIA_CAPTURE: ScreenName.IMAGE_TASK,
    HYBRID_CAPTURE: ScreenName.LINGUASENSE,
    CAPTURE_VIDEO: ScreenName.VIDEO_TASK,
    TEXT_INPUT_TASK: ScreenName.LINGUASENSE_ENGINE,
    VALIDATION_TASK: ScreenName.VALIDATION_TASK_EXECUTION,
    TASK_SUCCESS: ScreenName.HOME,
    LINGUASENSE_PORTAL: ScreenName.LINGUASENSE_ENGINE,
};

/** Resolve a task type to the current contributor task screen. */
export const getTaskScreen = (taskType?: string | null): ScreenName => {
    const normalizedType = taskType?.trim().toLowerCase();
    return (normalizedType && TASK_SCREEN_BY_TYPE[normalizedType]) || ScreenName.HOME;
};

/**
 * Resolve database and legacy targets to screens rendered by the canonical app.
 * A known task type takes precedence over generic legacy detail routes.
 */
export const normalizeScreen = (
    targetScreen?: string | ScreenName | null,
    taskType?: string | null,
): ScreenName => {
    const normalizedTarget = targetScreen?.trim().toUpperCase();
    const normalizedType = taskType?.trim().toLowerCase();

    if (normalizedTarget && normalizedTarget === ScreenName.TASK_DETAILS && normalizedType) {
        return getTaskScreen(normalizedType);
    }

    if (normalizedTarget && CANONICAL_SCREEN_NAMES.has(normalizedTarget as ScreenName)) {
        return normalizedTarget as ScreenName;
    }

    if (normalizedTarget && LEGACY_SCREEN_ALIASES[normalizedTarget]) {
        return LEGACY_SCREEN_ALIASES[normalizedTarget];
    }

    return normalizedType ? getTaskScreen(normalizedType) : ScreenName.HOME;
};

/** Infer the task type from legacy featured-card icon names. */
export const getTaskTypeFromIcon = (iconName?: string | null): string | null => {
    const icon = iconName?.trim().toLowerCase();
    if (!icon) return null;
    if (['mic', 'microphone', 'record-voice-over'].includes(icon)) return 'voice';
    if (['image', 'camera-alt', 'photo-camera', 'camera'].includes(icon)) return 'image';
    if (['videocam', 'video-camera-back'].includes(icon)) return 'video';
    if (['verified', 'rate-review', 'check-circle'].includes(icon)) return 'validation';
    if (['text-fields', 'language', 'description'].includes(icon)) return 'text';
    return null;
};
