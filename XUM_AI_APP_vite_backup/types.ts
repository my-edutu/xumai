
export enum ScreenName {
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  AUTH = 'AUTH',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  HOME = 'HOME',
  TASK_MARKETPLACE = 'TASK_MARKETPLACE',
  TASK_DETAILS = 'TASK_DETAILS',
  TASK_SUBMISSION = 'TASK_SUBMISSION',
  WALLET = 'WALLET',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  LEADERBOARD = 'LEADERBOARD',
  CREATE_TASK = 'CREATE_TASK',
  LINGUASENSE = 'LINGUASENSE',
  LANGUAGE_RUNNER = 'LANGUAGE_RUNNER',
  CAPTURE_CHOICE = 'CAPTURE_CHOICE',
  CAPTURE_AUDIO = 'CAPTURE_AUDIO',
  MEDIA_CAPTURE = 'MEDIA_CAPTURE',
  HYBRID_CAPTURE = 'HYBRID_CAPTURE',
  CAPTURE_VIDEO = 'CAPTURE_VIDEO',
  TEXT_INPUT_TASK = 'TEXT_INPUT_TASK',
  VALIDATION_TASK = 'VALIDATION_TASK',
  SUBMISSION_TRACKER = 'SUBMISSION_TRACKER',
  NOTIFICATIONS = 'NOTIFICATIONS',
  WITHDRAW = 'WITHDRAW',
  REFERRALS = 'REFERRALS',
  TASK_SUCCESS = 'TASK_SUCCESS',
  XUM_JUDGE = 'XUM_JUDGE',
  RLHF_CORRECTION = 'RLHF_CORRECTION',
  SUPPORT = 'SUPPORT',
  // Admin screens
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USER_MANAGEMENT = 'ADMIN_USER_MANAGEMENT',
  ADMIN_TASK_MODERATION = 'ADMIN_TASK_MODERATION',
  ADMIN_PAYOUTS = 'ADMIN_PAYOUTS',
  LINGUASENSE_PORTAL = 'LINGUASENSE_PORTAL',
  COMPANY_DASHBOARD = 'COMPANY_DASHBOARD'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  xp: number;
  timeEstimate: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'audio' | 'text' | 'image' | 'validation' | 'linguasense';
  priority?: boolean;
}

export interface User {
  name: string;
  level: number;
  currentXp: number;
  targetXp: number;
  balance: number;
}

export interface LinguasenseTask {
  id: string;
  prompt: string;
  context?: string;
  type: 'text' | 'voice' | 'both';
  reward: number;
  xp: number;
  targetLanguage: string;
}
