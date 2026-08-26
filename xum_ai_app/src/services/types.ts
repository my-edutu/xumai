/**
 * XUM AI - Service Type Definitions
 * 
 * Centralized types for service modules to avoid circular dependencies.
 */

export type TaskType = 'voice' | 'image' | 'video' | 'text' | 'validation' | 'rlhf';
export type SubmissionStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface TaskPrompt {
    id: string;
    task_type: TaskType;
    prompt_text: string;
    category: string;
    hint_text?: string;
    base_reward: number;
    bonus_reward: number;
    language_code?: string;
    difficulty_level: number;
    source?: 'enterprise' | 'gap_engine' | 'user_capture' | 'third_party' | 'ai_generated';
    enterprise_client_id?: string;
}

export interface TaskSubmission {
    id?: string;
    user_id: string;
    prompt_id: string;
    campaign_id?: string;
    task_type: TaskType;
    file_url: string;
    file_size?: number;
    duration_seconds?: number;
    translation_text?: string;
    description?: string;
    status: SubmissionStatus;
    base_reward: number;
    bonus_reward: number;
    total_reward: number;
    session_id?: string;
    metadata?: Record<string, any>;
}

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
    filePath?: string;
}

export interface SubmissionResult {
    success: boolean;
    submission?: TaskSubmission;
    error?: string;
}

export interface FeaturedTask {
    id: string;
    title: string;
    subtitle?: string;
    badge_text: string;
    gradient_start: string;
    gradient_end: string;
    icon_name: string;
    target_screen: string;
    display_order: number;
}

export interface AdminTask {
    id: string;
    category: 'daily_mission' | 'xum_judge';
    task_type?: string;
    title: string;
    subtitle?: string;
    description?: string;
    icon_name: string;
    icon_color: string;
    reward: number;
    estimated_time?: string;
    target_screen: string;
    is_locked_for_new_users?: boolean;
    unlock_after_tasks?: number;
    is_unlocked?: boolean;
}

export interface Transaction {
    id: string;
    user_id: string;
    type: 'earn' | 'bonus' | 'withdraw' | 'refund' | 'adjustment';
    amount: number;
    description: string;
    reference_type?: string;
    reference_id?: string;
    created_at: string;
}

export interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    country?: string;
    total_earned: number;
    tasks_completed: number;
    rank: number;
}

export interface DatasetItem {
    id: string;
    file_url: string | null;
    submitted_at: string;
    contributor: {
        name: string | null;
        language: string | null;
        country: string | null;
        role: string | null;
        level: number | null;
    };
    task: {
        type: string | null;
        category: string | null;
        difficulty: number | null;
    };
    capture: {
        platform: string | null;
        file_size_bytes: number | null;
        duration_seconds: number | null;
        captured_at: string | null;
    };
}

export interface DatasetManifest {
    dataset_id: string;
    task_title: string;
    exported_at: string;
    total_approved: number;
    format_version: string;
    items: DatasetItem[];
}

export interface CompanyNotification {
    id: string;
    task_id: string;
    type: 'milestone' | 'task_completed';
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface CampaignGuidelines {
    what_to_do: string;
    what_not_to_do?: string;
    quality_requirements?: string;
}

export interface CompanyCampaign {
    id: string;
    company_id: string;
    title: string;
    description: string;
    guidelines: CampaignGuidelines;
    sample_reference?: string;
    task_type: string;
    target_count: number;
    completed_count: number;
    status: 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'cancelled';
    priority_level: 'standard' | 'high' | 'urgent';
    feed_priority: number;
    timeframe_days: number;
    starts_at?: string;
    ends_at?: string;
    quality_tier: 'basic' | 'standard' | 'premium';
    region_filter: string[];
    language_filter: string[];
    min_contributor_level: number;
    budget_usd?: number;
    platform_fee?: number;
    total_cost?: number;
    max_submissions_per_user: number;
    created_at: string;
}

export interface LexiconConcept {
    id: string;
    emoji?: string;
    word: string;
    category: string;
    reward: number;
    status: 'active' | 'archived';
}

export interface ValidationTask {
    id: string;
    submission_type: 'lexicon' | 'rlhf';
    prompt: string;
    details: {
        concept?: string;
        local_word?: string;
        cultural_note?: string;
        pronunciation_url?: string;
        original_response?: string;
        corrected_response?: string;
        correction_reason?: string;
        cultural_region?: string;
    };
    reward: number;
}

