/**
 * XUM AI - Services Index
 * 
 * Central export point for all service modules.
 */

// Task submission
export {
    TaskService,
    uploadFile,
    submitTask,
    submitPayload,
    getUserSubmissions,
    getUserTaskStats,
    saveSubmissionMetadata,
    generateSessionId,
    checkServiceHealth,
} from './taskService';

// Prompts
export {
    PromptService,
} from './promptService';

// Marketplace & Home
export {
    getFeaturedTasks,
    getDailyMissions,
    getXumJudgeTasks,
    getActiveTasks,
    checkJudgeUnlock,
    getFeedTasks,
} from './marketplaceService';

// Wallet & Earnings
export {
    getUserBalance,
    getTransactionHistory,
    requestWithdrawal,
    getLeaderboard,
    getUserEarningsPeriod,
} from './walletService';

// Company
export {
    getCompanyDataset,
    getCompanyNotifications,
    markNotificationsRead,
} from './companyService';

// User Profile & Preferences
export { UserService } from './userService';

// Referrals
export {
    deriveReferralCode,
    referralLinkFor,
    normalizeReferralCode,
    captureReferralFromUrl,
    storePendingReferralCode,
    getPendingReferralCode,
    clearPendingReferralCode,
    applyPendingReferral,
    REFERRAL_BASE_REWARD,
} from './referralService';

// Types
export * from './types';

// Media capture
export * from './mediaCapture';
