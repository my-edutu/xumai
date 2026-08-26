/**
 * XUM AI — Submission Validation Screen
 *
 * Allows users to review and vote on other users' submissions.
 * Earns $0.08 per vote that contributes to consensus.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../../context/ThemeContext';
import { ScreenName } from '../../types';
import { createGlobalStyles } from '../../styles';
import {
    getNextSubmissionToValidate,
    submitValidationVote,
    getValidatorReward,
    getValidatedTodayCount,
    SubmissionToValidate,
} from '../../services/validationService';

// ============================================================================
// TYPES
// ============================================================================

interface SubmissionValidationScreenProps {
    onNavigate: (screen: ScreenName) => void;
    session?: { user: { id: string } | null };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REWARD = getValidatorReward();

const TASK_TYPE_COLORS: Record<string, string> = {
    voice: '#ec4899',
    image: '#8b5cf6',
    video: '#10b981',
    text: '#3b82f6',
    lexicon: '#f59e0b',
    rlhf: '#6366f1',
    validation: '#14b8a6',
    unknown: '#6b7280',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SubmissionValidationScreen: React.FC<SubmissionValidationScreenProps> = ({
    onNavigate,
    session,
}) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);
    const userId = session?.user?.id;

    // Data
    const [submission, setSubmission] = useState<SubmissionToValidate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);

    // Vote state
    const [selectedVote, setSelectedVote] = useState<'approve' | 'reject' | null>(null);
    const [confidence, setConfidence] = useState(3);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Success flash
    const [showSuccess, setShowSuccess] = useState(false);
    const [totalEarned, setTotalEarned] = useState(0);

    // Counter
    const [validatedToday, setValidatedToday] = useState(0);

    // Audio playback (for voice submissions)
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // ── Cleanup audio on unmount ─────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (sound) sound.unloadAsync();
        };
    }, [sound]);

    // ── Load initial data ────────────────────────────────────────────────────
    useEffect(() => {
        if (userId) {
            loadNext();
            loadTodayCount();
        }
    }, [userId]);

    const loadTodayCount = async () => {
        if (!userId) return;
        const count = await getValidatedTodayCount(userId);
        setValidatedToday(count);
    };

    const loadNext = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        setSelectedVote(null);
        setConfidence(3);
        setReason('');
        setShowSuccess(false);

        // Stop any playing audio
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
        }

        const next = await getNextSubmissionToValidate(userId);
        if (next) {
            setSubmission(next);
            setIsEmpty(false);
        } else {
            setSubmission(null);
            setIsEmpty(true);
        }
        setIsLoading(false);
    }, [userId, sound]);

    // ── Audio playback ───────────────────────────────────────────────────────
    const toggleAudio = async (uri: string) => {
        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: true }
                );
                setSound(newSound);
                setIsPlaying(true);
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                        newSound.setPositionAsync(0);
                    }
                });
            }
        } catch (err) {
            Alert.alert('Playback Error', 'Could not play audio');
        }
    };

    // ── Submit vote ──────────────────────────────────────────────────────────
    const handleSubmitVote = async () => {
        if (!submission || !userId || !selectedVote) return;
        if (selectedVote === 'reject' && !reason.trim()) {
            Alert.alert('Reason Required', 'Please provide a reason for rejection.');
            return;
        }

        setIsSubmitting(true);
        const result = await submitValidationVote(
            submission.id,
            userId,
            submission.submission_type,
            selectedVote,
            confidence,
            selectedVote === 'reject' ? reason.trim() : undefined
        );
        setIsSubmitting(false);

        if (result.success) {
            setTotalEarned(prev => prev + REWARD);
            setValidatedToday(prev => prev + 1);
            setShowSuccess(true);

            // Auto-load next after brief delay
            setTimeout(() => {
                loadNext();
            }, 1500);
        } else {
            Alert.alert('Error', result.error || 'Could not submit vote. Please try again.');
        }
    };

    // ── Render media content ─────────────────────────────────────────────────
    const renderMedia = (sub: SubmissionToValidate) => {
        const fileUrl = sub.details?.file_url;
        const type = sub.task_type;

        if (!fileUrl) {
            // Text/Lexicon submission
            const text = sub.details?.translation_text
                || sub.details?.description
                || 'No content available';
            return (
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 12,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                    minHeight: 120,
                    justifyContent: 'center',
                    marginBottom: 20,
                }}>
                    <Text style={{ color: theme.text, fontSize: 16, lineHeight: 24 }}>
                        {text}
                    </Text>
                </View>
            );
        }

        if (type === 'image') {
            return (
                <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20, height: 220 }}>
                    <Image
                        source={{ uri: fileUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                </View>
            );
        }

        if (type === 'voice') {
            return (
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 20,
                }}>
                    <TouchableOpacity
                        onPress={() => toggleAudio(fileUrl)}
                        style={{
                            width: 56, height: 56, borderRadius: 28,
                            backgroundColor: theme.primary,
                            justifyContent: 'center', alignItems: 'center',
                            marginRight: 16,
                        }}
                    >
                        <MaterialIcons
                            name={isPlaying ? 'pause' : 'play-arrow'}
                            size={30}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    {/* Waveform placeholder bars */}
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    flex: 1,
                                    height: Math.random() * 24 + 8,
                                    backgroundColor: isPlaying
                                        ? theme.primary
                                        : `${theme.primary}50`,
                                    borderRadius: 2,
                                }}
                            />
                        ))}
                    </View>
                </View>
            );
        }

        if (type === 'video') {
            return (
                <View style={{
                    height: 200,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <MaterialIcons name="play-circle-filled" size={64} color="rgba(255,255,255,0.8)" />
                    <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 12 }}>
                        Video submission
                    </Text>
                </View>
            );
        }

        // Generic fallback
        return (
            <View style={{
                backgroundColor: theme.background,
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: theme.border,
                marginBottom: 20,
                alignItems: 'center',
            }}>
                <MaterialIcons name="attachment" size={40} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
                    {type} submission
                </Text>
            </View>
        );
    };

    // ── Success Flash ────────────────────────────────────────────────────────
    if (showSuccess) {
        return (
            <View style={[styles.screenContainer, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: theme.success, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                    <MaterialIcons name="check" size={48} color="#fff" />
                </View>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Vote Recorded!</Text>
                <Text style={{ color: theme.success, fontSize: 28, fontWeight: '900', marginBottom: 4 }}>+${REWARD.toFixed(2)}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Loading next submission…</Text>
            </View>
        );
    }

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={[styles.screenContainer, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Loading submission…</Text>
            </View>
        );
    }

    // ── Empty State ──────────────────────────────────────────────────────────
    if (isEmpty || !submission) {
        return (
            <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>VALIDATE</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <MaterialIcons name="check-circle" size={64} color={theme.success} />
                    <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', marginTop: 20, textAlign: 'center' }}>
                        All caught up!
                    </Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
                        No pending submissions to validate right now.{'\n'}Check back later.
                    </Text>
                    {validatedToday > 0 && (
                        <Text style={{ color: theme.primary, fontWeight: '700', marginTop: 24, fontSize: 15 }}>
                            {validatedToday} validated today · ${(validatedToday * REWARD).toFixed(2)} earned
                        </Text>
                    )}
                    <TouchableOpacity
                        onPress={() => onNavigate(ScreenName.HOME)}
                        style={{ marginTop: 32, backgroundColor: theme.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Main UI ──────────────────────────────────────────────────────────────
    const typeColor = TASK_TYPE_COLORS[submission.task_type] ?? TASK_TYPE_COLORS.unknown;

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>VALIDATE</Text>
                <View style={{ backgroundColor: `${theme.success}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: theme.success, fontWeight: '700', fontSize: 12 }}>+${REWARD.toFixed(2)}/vote</Text>
                </View>
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {/* Counter */}
                {validatedToday > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <MaterialIcons name="check-circle" size={14} color={theme.success} style={{ marginRight: 6 }} />
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                            {validatedToday} validated today
                            {totalEarned > 0 && ` · $${totalEarned.toFixed(2)} earned`}
                        </Text>
                    </View>
                )}

                {/* Task Type Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{
                        backgroundColor: `${typeColor}20`,
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: `${typeColor}40`,
                    }}>
                        <Text style={{ color: typeColor, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {submission.task_type}
                        </Text>
                    </View>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 10 }}>
                        {new Date(submission.created_at).toLocaleDateString()}
                    </Text>
                </View>

                {/* Media Content */}
                {renderMedia(submission)}

                {/* Description (if any) */}
                {submission.details?.description && (
                    <View style={{
                        backgroundColor: theme.surface,
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: theme.border,
                        marginBottom: 20,
                    }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 }}>DESCRIPTION</Text>
                        <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>
                            {submission.details.description}
                        </Text>
                    </View>
                )}

                {/* Vote Buttons */}
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 12 }}>
                    Is this submission high quality?
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    <TouchableOpacity
                        onPress={() => setSelectedVote('approve')}
                        style={{
                            flex: 1,
                            paddingVertical: 16,
                            borderRadius: 14,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: selectedVote === 'approve' ? '#10b981' : `${'#10b981'}15`,
                            borderWidth: 2,
                            borderColor: selectedVote === 'approve' ? '#10b981' : `${'#10b981'}30`,
                        }}
                    >
                        <MaterialIcons
                            name="thumb-up"
                            size={20}
                            color={selectedVote === 'approve' ? '#fff' : '#10b981'}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={{
                            color: selectedVote === 'approve' ? '#fff' : '#10b981',
                            fontWeight: '800', fontSize: 15,
                        }}>
                            Approve
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setSelectedVote('reject')}
                        style={{
                            flex: 1,
                            paddingVertical: 16,
                            borderRadius: 14,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: selectedVote === 'reject' ? '#f43f5e' : `${'#f43f5e'}15`,
                            borderWidth: 2,
                            borderColor: selectedVote === 'reject' ? '#f43f5e' : `${'#f43f5e'}30`,
                        }}
                    >
                        <MaterialIcons
                            name="thumb-down"
                            size={20}
                            color={selectedVote === 'reject' ? '#fff' : '#f43f5e'}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={{
                            color: selectedVote === 'reject' ? '#fff' : '#f43f5e',
                            fontWeight: '800', fontSize: 15,
                        }}>
                            Reject
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Reason (shows only on reject) */}
                {selectedVote === 'reject' && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 8 }}>
                            Reason for rejection <Text style={{ color: '#f43f5e' }}>*</Text>
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.surface,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.border,
                                color: theme.text,
                                padding: 14,
                                fontSize: 14,
                                minHeight: 80,
                                textAlignVertical: 'top',
                            }}
                            placeholder="e.g. Background noise, blurry, off-topic…"
                            placeholderTextColor={theme.textSecondary}
                            value={reason}
                            onChangeText={setReason}
                            multiline
                        />
                    </View>
                )}

                {/* Confidence Stars */}
                {selectedVote && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 10 }}>
                            Confidence level
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setConfidence(star)}
                                >
                                    <MaterialIcons
                                        name={star <= confidence ? 'star' : 'star-border'}
                                        size={32}
                                        color={star <= confidence ? '#f59e0b' : theme.border}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Submit Button */}
                {selectedVote && (
                    <TouchableOpacity
                        onPress={handleSubmitVote}
                        disabled={isSubmitting}
                        style={{
                            backgroundColor: theme.primary,
                            borderRadius: 14,
                            paddingVertical: 16,
                            alignItems: 'center',
                            opacity: isSubmitting ? 0.6 : 1,
                        }}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 }}>
                                Submit Vote · +${REWARD.toFixed(2)}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                {/* Skip */}
                <TouchableOpacity
                    onPress={loadNext}
                    style={{ alignItems: 'center', paddingVertical: 16 }}
                >
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Skip this submission</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};
