/**
 * XUM AI Type Definitions
 * Centralized type definitions for the entire application.
 */

// ============================================================================
// NAVIGATION
// ============================================================================

export enum ScreenName {
  // Auth Flow
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  AUTH = 'AUTH',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  ACCOUNT_TYPE_SELECT = 'ACCOUNT_TYPE_SELECT',
  SKILL_SETUP = 'SKILL_SETUP',
  LANGUAGE_SELECTION = 'LANGUAGE_SELECTION',
  TASK_INTERESTS = 'TASK_INTERESTS',

  // Main User Flow
  HOME = 'HOME',
  TASK_MARKETPLACE = 'TASK_MARKETPLACE',
  TASK_DETAILS = 'TASK_DETAILS',
  TASK_SUBMISSION = 'TASK_SUBMISSION',
  WALLET = 'WALLET',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  PAYMENT_METHODS = 'PAYMENT_METHODS',
  LEADERBOARD = 'LEADERBOARD',
  NOTIFICATIONS = 'NOTIFICATIONS',
  WITHDRAW = 'WITHDRAW',
  REFERRALS = 'REFERRALS',
  SUPPORT = 'SUPPORT',
  SUBMISSION_TRACKER = 'SUBMISSION_TRACKER',
  EDIT_PROFILE = 'EDIT_PROFILE',

  // Task Execution Flow
  CREATE_TASK = 'CREATE_TASK',
  LEXICON_TASK = 'LEXICON_TASK',
  LINGUASENSE = 'LINGUASENSE',
  LINGUASENSE_ENGINE = 'LINGUASENSE_ENGINE',
  ENVIRONMENTAL_SENSING = 'ENVIRONMENTAL_SENSING',
  APPEARANCE_LABS = 'APPEARANCE_LABS',
  LANGUAGE_RUNNER = 'LANGUAGE_RUNNER',
  CAPTURE_CHOICE = 'CAPTURE_CHOICE',
  CAPTURE_AUDIO = 'CAPTURE_AUDIO',
  MEDIA_CAPTURE = 'MEDIA_CAPTURE',
  HYBRID_CAPTURE = 'HYBRID_CAPTURE',
  CAPTURE_VIDEO = 'CAPTURE_VIDEO',
  VOICE_TASK = 'VOICE_TASK',
  IMAGE_TASK = 'IMAGE_TASK',
  VIDEO_TASK = 'VIDEO_TASK',
  TEXT_INPUT_TASK = 'TEXT_INPUT_TASK',
  VALIDATION_TASK = 'VALIDATION_TASK',
  TASK_SUCCESS = 'TASK_SUCCESS',
  XUM_JUDGE = 'XUM_JUDGE',
  RECORDS = 'RECORDS',
  RLHF_CORRECTION = 'RLHF_CORRECTION',
  VALIDATION_TASK_EXECUTION = 'VALIDATION_TASK_EXECUTION',

  // Admin Flow
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USER_MANAGEMENT = 'ADMIN_USER_MANAGEMENT',
  ADMIN_TASK_MODERATION = 'ADMIN_TASK_MODERATION',
  ADMIN_PAYOUTS = 'ADMIN_PAYOUTS',
  ADMIN_CAMPAIGNS = 'ADMIN_CAMPAIGNS',
  ADMIN_AUDIT_LOGS = 'ADMIN_AUDIT_LOGS',
  ADMIN_FRAUD_DETECTION = 'ADMIN_FRAUD_DETECTION',
  ADMIN_SESSIONS = 'ADMIN_SESSIONS',
  ADMIN_LEXICON = 'ADMIN_LEXICON',
  ADMIN_MARKETPLACE_MANAGEMENT = 'ADMIN_MARKETPLACE_MANAGEMENT',

  // Validation / Quality Pipeline
  SUBMISSION_VALIDATION = 'SUBMISSION_VALIDATION',

  // Company/Enterprise Flow (Future)
  LINGUASENSE_PORTAL = 'LINGUASENSE_PORTAL',
  COMPANY_DASHBOARD = 'COMPANY_DASHBOARD',
  PROMPT_GENIUS = 'PROMPT_GENIUS',
  GAP_DASHBOARD = 'GAP_DASHBOARD',

  // Dataset Marketplace
  DATA_SALES = 'DATA_SALES',

  // XUM Judge — Quality & Safety
  SAFETY_SCORING = 'SAFETY_SCORING',
  CULTURAL_APPROPRIATENESS = 'CULTURAL_APPROPRIATENESS',
}

// ============================================================================
// USER & PROFILE
// ============================================================================

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  full_name: string;
  balance: number;
  role: 'worker' | 'admin' | 'contributor';
  precision_score?: number;
  total_tasks_completed?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// TASKS
// ============================================================================

export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';
export type TaskType = 'audio' | 'text' | 'image' | 'validation' | 'linguasense' | 'video' | 'rlhf';

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  timeEstimate: string;
  difficulty: TaskDifficulty;
  type: TaskType;
  priority?: boolean;
  created_at?: string;
  expires_at?: string;
}

export interface LinguasenseTask {
  id: string;
  prompt: string;
  context?: string;
  type: 'text' | 'voice' | 'both';
  reward: number;
  targetLanguage: string;
}

// ============================================================================
// TRANSACTIONS & WALLET
// ============================================================================

export type TransactionType = 'earn' | 'withdraw' | 'bonus' | 'referral';

export interface Transaction {
  id?: string;
  user_id?: string;
  title?: string;
  date?: string;
  amount: string | number;
  type: TransactionType | string;
  icon?: string;
  color?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  created_at?: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  total_earned: number;
  tasks_completed: number;
  rank: number;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: 'paypal' | 'bank_transfer' | 'crypto';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  account_details: Record<string, unknown>;
  created_at: string;
  processed_at?: string;
}

// ============================================================================
// THEME & UI
// ============================================================================

export interface Theme {
  id: string;
  name: string;
  primary: string;
  bg: string;
  surface: string;
  cardGradient: string;
}

// ============================================================================
// COMMON PROPS
// ============================================================================

export interface BaseScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export interface DashboardScreenProps extends BaseScreenProps {
  balance?: number;
  history?: Transaction[];
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  activeThemeId?: string;
  setActiveThemeId?: (id: string) => void;
  themes?: Theme[];
  profile?: UserProfile | null;
}

export interface TaskScreenProps extends BaseScreenProps {
  onCompleteTask?: (reward: number, xp: number) => void;
}

// ============================================================================
// METADATA
// ============================================================================

/**
 * Structured metadata collected per submission.
 * User-provided fields are optional; auto-captured fields are always present.
 */
export interface SubmissionMetadata {
  // Auto-captured (always present)
  platform: string;           // 'ios' | 'android' | 'web'
  consent_given: boolean;
  prompt_text?: string;       // Exact text of the prompt shown

  // User-provided (optional, collected via MetadataCollectionModal)
  language?: string;          // e.g. 'yo', 'ha', 'en', 'fr'
  country_code?: string;      // ISO 3166-1 alpha-2, e.g. 'NG', 'KE'

  // Image / Video specific
  environment?: 'indoor' | 'outdoor';
  scene_category?: string;    // 'market' | 'home' | 'road' | 'office' | 'farm' | 'school' | 'other'

  // Voice specific
  noise_level?: 'low' | 'medium' | 'high';
}

// ============================================================================
// VALIDATION PIPELINE
// ============================================================================

export type ValidationVote = 'approve' | 'reject';

export interface SubmissionToValidate {
  id: string;
  task_type: string;
  submission_data: {
    file_url?: string;
    task_type?: string;
    description?: string;
    translation_text?: string;
    [key: string]: any;
  };
  created_at: string;
  user_id: string;
}

export interface PreCheckResult {
  passed: boolean;
  flags: string[];
  warnings: string[];
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  task_type: string;
  item_count: number;
  status: 'building' | 'ready' | 'exported';
  metadata: Record<string, any>;
  created_at: string;
}
