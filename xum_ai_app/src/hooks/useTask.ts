/**
 * XUM AI - useTask Hook
 * 
 * A reusable hook for managing task capture flows including:
 * - Loading prompts from Supabase
 * - Recording/capturing state
 * - File upload to storage
 * - Task submission
 * - Session management
 */

import { useState, useEffect, useCallback } from 'react';
import { TaskService } from '../services/taskService';
import { TaskPrompt, TaskType, TaskSubmission } from '../services/types';
import { PromptService } from '../services/promptService';
import { QualityService } from '../services/qualityService';
import { supabase } from '../supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface UseTaskOptions {
    taskType: TaskType;
    tasksPerSession?: number;
    initialUserId?: string; // Pass Clerk user ID directly — avoids supabase.auth.getSession() which returns null on Clerk
    campaignId?: string;
}

export interface UseTaskReturn {
    // State
    prompts: TaskPrompt[];
    currentPrompt: TaskPrompt | null;
    currentIndex: number;
    completedTasks: number;
    isLoading: boolean;
    isSubmitting: boolean;
    isRecording: boolean;
    showSuccess: boolean;
    sessionReward: number;
    error: string | null;

    // Actions
    startRecording: () => void;
    stopRecording: () => void;
    submitTask: (fileUri: string, translationText?: string, metadata?: Record<string, any>) => Promise<boolean>;
    skipPrompt: () => void;
    resetSession: () => void;
    loadPrompts: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useTask({ taskType, tasksPerSession = 5, initialUserId, campaignId }: UseTaskOptions): UseTaskReturn {
    // User session — seed from Clerk-provided ID if available, otherwise try Supabase session
    const [userId, setUserId] = useState<string | null>(initialUserId ?? null);
    const [sessionId] = useState(() => TaskService.generateSessionId());

    // Prompts
    const [prompts, setPrompts] = useState<TaskPrompt[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Task state
    const [completedTasks, setCompletedTasks] = useState(0);
    const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
    const [sessionReward, setSessionReward] = useState(0);

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If Clerk user ID was provided directly, skip Supabase auth lookup
    useEffect(() => {
        if (initialUserId) {
            // Already set via useState initializer — nothing to do
            return;
        }
        const getUser = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (!error && data.session?.user) {
                    setUserId(data.session.user.id);
                } else if (!data.session?.user) {
                    console.log('[useTask] No active session found');
                    setError('Please sign in to view tasks');
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('[useTask] Auth error:', err);
                setError('Authentication failed');
                setIsLoading(false);
            }
        };
        getUser();
    }, [initialUserId]);

    // Load prompts when user ID is available
    useEffect(() => {
        if (userId) {
            loadPrompts();
        }
    }, [userId, taskType]);

    // Load prompts from database
    const loadPrompts = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const newPrompts = await PromptService.getRandomPrompts(taskType, tasksPerSession + 3); // Extra for skips
            setPrompts(newPrompts);
            setCurrentIndex(0);
        } catch (err: any) {
            console.error('[useTask] Failed to load prompts:', err);
            setError('Failed to load tasks. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [userId, taskType, tasksPerSession]);

    // Current prompt
    const currentPrompt = prompts.length > 0 && currentIndex < prompts.length
        ? prompts[currentIndex]
        : null;

    // Start recording/capturing
    const startRecording = useCallback(() => {
        setIsRecording(true);
        setError(null);
    }, []);

    // Stop recording/capturing
    const stopRecording = useCallback(() => {
        setIsRecording(false);
    }, []);

    // Submit task
    const submitTask = useCallback(async (
        fileUri: string,
        translationText?: string,
        metadata?: Record<string, any>
    ): Promise<boolean> => {
        if (!userId || !currentPrompt) {
            setError('User or prompt not available');
            return false;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Determine file extension from task type
            const extension = taskType === 'voice' ? 'm4a'
                : taskType === 'image' ? 'jpg'
                    : 'mp4';

            // ── Quality Analysis ───────────────────────────────────────────
            let qualityScore = null;
            let metrics: Record<string, any> = {};

            if (taskType === 'voice') {
                const analysis = await QualityService.analyzeAudioQuality(fileUri);
                qualityScore = analysis.overall;
                metrics = { snr: analysis.snr, clarity: analysis.clarity, isSilenced: analysis.isSilenced };
            } else if (taskType === 'image') {
                const analysis = await QualityService.analyzeImageQuality(fileUri);
                qualityScore = analysis.overall;
                metrics = { blur: analysis.blur, nsfw: analysis.nsfw };
            }

            // Upload file
            const uploadResult = await TaskService.uploadFile(
                fileUri,
                taskType,
                userId,
                extension
            );

            if (!uploadResult.success || !uploadResult.url) {
                setError(uploadResult.error || 'Failed to upload file');
                setIsSubmitting(false);
                return false;
            }

            // Submit task — include prompt context so saveSubmissionMetadata
            // can store category, difficulty and language without extra DB calls.
            const submitResult = await TaskService.submitTask(
                userId,
                currentPrompt.id,
                taskType,
                uploadResult.url,
                {
                    translationText,
                    sessionId,
                    metadata: {
                        ...metadata,
                        filePath: uploadResult.filePath,
                        promptCategory: currentPrompt.category,
                        difficultyLevel: currentPrompt.difficulty_level,
                        promptLanguageCode: currentPrompt.language_code,
                        qualityScore,
                        metrics,
                    },
                    campaignId: campaignId,
                }
            );

            if (!submitResult.success) {
                setError(submitResult.error || 'Failed to submit task');
                setIsSubmitting(false);
                return false;
            }

            // Update state
            const newSubmission = submitResult.submission!;
            setSubmissions(prev => [...prev, newSubmission]);
            setSessionReward(prev => prev + newSubmission.total_reward);

            const newCompleted = completedTasks + 1;
            setCompletedTasks(newCompleted);

            // Check if session complete
            if (newCompleted >= tasksPerSession) {
                setShowSuccess(true);
            } else {
                setCurrentIndex(prev => prev + 1);
            }

            setIsSubmitting(false);
            return true;
        } catch (err: any) {
            console.error('[useTask] Submit error:', err);
            setError(err.message || 'Submission failed');
            setIsSubmitting(false);
            return false;
        }
    }, [userId, currentPrompt, taskType, sessionId, completedTasks, tasksPerSession]);

    // Skip current prompt
    const skipPrompt = useCallback(() => {
        if (currentIndex < prompts.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, prompts.length]);

    // Reset session
    const resetSession = useCallback(() => {
        setCompletedTasks(0);
        setSubmissions([]);
        setSessionReward(0);
        setShowSuccess(false);
        setCurrentIndex(0);
        loadPrompts();
    }, [loadPrompts]);

    return {
        // State
        prompts,
        currentPrompt,
        currentIndex,
        completedTasks,
        isLoading,
        isSubmitting,
        isRecording,
        showSuccess,
        sessionReward,
        error,

        // Actions
        startRecording,
        stopRecording,
        submitTask,
        skipPrompt,
        resetSession,
        loadPrompts,
    };
}

export default useTask;
