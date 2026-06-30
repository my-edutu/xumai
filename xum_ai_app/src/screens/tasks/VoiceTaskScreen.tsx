import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTask } from '../../hooks/useTask';
import { MediaCapture, formatDuration } from '../../services/mediaCapture';
import { runPreCheck } from '../../services/preCheckService';
import { ScreenName } from '../../types';
import { createGlobalStyles, createCaptureStyles } from '../../styles';

interface VoiceTaskScreenProps {
    onNavigate: (screen: ScreenName) => void;
    session?: { user: { id: string } | null };
    campaignId?: string;
}

export const VoiceTaskScreen: React.FC<VoiceTaskScreenProps> = ({ onNavigate, session, campaignId }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);
    const captureStyles = createCaptureStyles(theme);
    const audioRecorder = useRef<Audio.Recording | null>(null);
    const {
        currentPrompt,
        completedTasks,
        isLoading,
        isSubmitting,
        isRecording,
        showSuccess,
        sessionReward,
        error,
        startRecording,
        stopRecording,
        submitTask,
        skipPrompt,
        resetSession
    } = useTask({
        taskType: 'voice',
        tasksPerSession: 5,
        initialUserId: session?.user?.id ?? undefined,
        campaignId: campaignId
    });

    // Forms
    const [localWord, setLocalWord] = useState('');
    const [culturalContext, setCulturalContext] = useState('');
    const [showInputForm, setShowInputForm] = useState(false);

    // Recording state
    const [lastCheckResult, setLastCheckResult] = useState<any>(null);

    // Timer & Animation
    const [recordingDuration, setRecordingDuration] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Review & Playback State
    const [reviewMode, setReviewMode] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    // Cleanup sound on unmount/change
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
            if (audioRecorder.current) {
                MediaCapture.cancelAudioRecording(audioRecorder.current).catch(() => {
                    // Best-effort cleanup only.
                });
                Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                }).catch(() => {
                    // Best-effort cleanup only.
                });
                audioRecorder.current = null;
            }
        };
    }, [sound]);

    // Pulse Animation Effect
    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;

        if (isRecording) {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
        } else {
            pulseAnim.setValue(1);
        }

        return () => {
            if (animation) animation.stop();
        };
    }, [isRecording, pulseAnim]);

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            setRecordingDuration(0);
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    // Handle recording toggle
    const handleRecordToggle = async () => {
        if (isRecording) {
            const result = await MediaCapture.stopAudioRecording(audioRecorder.current ?? undefined);
            audioRecorder.current = null;
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            }).catch(() => {
                // Best-effort cleanup only.
            });
            stopRecording();

            if (result.success && result.uri) {
                setLastCheckResult({ ...result, duration: recordingDuration }); // Use our tracked duration
                setReviewMode(true);
            } else if (result.error) {
                Alert.alert('Error', result.error);
            }
        } else {
            const permission = await MediaCapture.requestAudioPermission();
            if (permission.granted) {
                try {
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: true,
                        playsInSilentModeIOS: true,
                    });

                    const { recording } = await Audio.Recording.createAsync(
                        Audio.RecordingOptionsPresets.HIGH_QUALITY
                    );
                    audioRecorder.current = recording;

                    if (recording) {
                        startRecording();
                        setShowInputForm(false);
                    } else {
                        Alert.alert('Error', 'Failed to start recording');
                    }
                } catch (err: any) {
                    console.error('Failed to prepare recording:', err);
                    Alert.alert('Error', 'Could not prepare audio recorder');
                }
            } else {
                Alert.alert('Permission Denied', 'Microphone access is required for this task.');
            }
        }
    };

    // Submit with auto-captured system metadata (no user prompt)
    const handleSubmit = async () => {
        if (!lastCheckResult?.uri) return;
        if (!localWord.trim()) {
            Alert.alert('Missing Information', 'Please enter the word you recorded.');
            return;
        }

        const success = await submitTask(
            lastCheckResult.uri,
            JSON.stringify({ word: localWord, context: culturalContext }),
            {
                durationSeconds: lastCheckResult.duration || recordingDuration,
                fileSize: lastCheckResult.size,
                collectedMetadata: { platform: Platform.OS, consent_given: true },
            }
        );

        if (success) {
            setLocalWord('');
            setCulturalContext('');
            setShowInputForm(false);
            setLastCheckResult(null);
            setRecordingDuration(0);
        } else if (error) {
            Alert.alert('Submission Failed', error);
        }
    };

    // Playback Logic
    const togglePlayback = async () => {
        if (!lastCheckResult?.uri) return;

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
                    { uri: lastCheckResult.uri },
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
            console.error('Playback failed', err);
            Alert.alert('Playback Error', 'Could not play audio');
        }
    };

    const handleRetake = async () => {
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
        }
        audioRecorder.current = null;
        setIsPlaying(false);
        setLastCheckResult(null);
        setReviewMode(false);
        setRecordingDuration(0);
    };

    const handleConfirm = async () => {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
        }

        // Pre-check before allowing submission
        const userId = session?.user?.id;
        if (userId && lastCheckResult?.uri) {
            const checkResult = await runPreCheck(
                lastCheckResult.uri,
                'voice',
                userId,
                lastCheckResult.size,
                recordingDuration
            );

            if (!checkResult.passed) {
                Alert.alert(
                    'Quality Check Failed',
                    checkResult.flags.join('\n\n'),
                    [
                        { text: 'Retake', onPress: handleRetake },
                        { text: 'Continue Anyway', style: 'destructive', onPress: () => { setReviewMode(false); setShowInputForm(true); } },
                    ]
                );
                return;
            }

            if (checkResult.warnings.length > 0) {
                Alert.alert('Warning', checkResult.warnings.join('\n'));
            }
        }

        setReviewMode(false);
        setShowInputForm(true);
    };

    if (isLoading) {
        return (
            <View style={[styles.screenContainer, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Loading tasks...</Text>
            </View>
        );
    }

    if (showSuccess) {
        return (
            <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                        <MaterialIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>COMPLETE</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.success, justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
                        <MaterialIcons name="check" size={56} color="#fff" />
                    </View>
                    <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 16 }}>Great Job!</Text>
                    <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 32 }}>You completed 5 voice recordings</Text>
                    <Text style={{ fontSize: 40, fontWeight: '700', color: theme.success }}>${sessionReward.toFixed(2)}</Text>
                    <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8 }}>Earned this session</Text>

                    <TouchableOpacity
                        style={{ marginTop: 48, backgroundColor: theme.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 }}
                        onPress={() => onNavigate(ScreenName.HOME)}
                    >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>CONTINUE EARNING</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>VOICE TASK</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Progress */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Progress</Text>
                        <Text style={{ color: theme.primary, fontWeight: '600' }}>{completedTasks}/5 tasks</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: theme.surface, borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ height: 8, backgroundColor: theme.primary, width: `${(completedTasks / 5) * 100}%` }} />
                    </View>
                </View>

                {/* Prompt Card */}
                {currentPrompt && (
                    <View style={[captureStyles.promptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            <View style={[captureStyles.promptBadge, { backgroundColor: `${theme.primary}20`, marginBottom: 0 }]}>
                                <Text style={[captureStyles.promptBadgeText, { color: theme.primary }]}>{currentPrompt.category}</Text>
                            </View>
                            {currentPrompt.source === 'enterprise' && (
                                <View style={[captureStyles.promptBadge, { backgroundColor: '#f59e0b20', marginBottom: 0 }]}>
                                    <Text style={[captureStyles.promptBadgeText, { color: '#f59e0b' }]}>Enterprise Priority</Text>
                                </View>
                            )}
                            {currentPrompt.source === 'gap_engine' && (
                                <View style={[captureStyles.promptBadge, { backgroundColor: '#10b98120', marginBottom: 0 }]}>
                                    <Text style={[captureStyles.promptBadgeText, { color: '#10b981' }]}>Gap Coverage</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[captureStyles.promptText, { color: theme.text }]}>{currentPrompt.prompt_text}</Text>
                        {currentPrompt.hint_text && (
                            <Text style={[captureStyles.promptHint, { color: theme.textSecondary }]}>{currentPrompt.hint_text}</Text>
                        )}
                        <View style={{ flexDirection: 'row', marginTop: 12 }}>
                            <Text style={{ color: theme.success, fontWeight: '600', fontSize: 12 }}>BASE: ${currentPrompt.base_reward.toFixed(2)}</Text>
                        </View>
                    </View>
                )}



                {/* Review UI */}
                {
                    reviewMode && (
                        <View style={{ marginTop: 24, alignItems: 'center' }}>
                            <Text style={{ fontSize: 32, fontWeight: '700', color: theme.text, fontVariant: ['tabular-nums'], marginBottom: 24 }}>
                                {formatDuration(recordingDuration)}
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
                                <TouchableOpacity
                                    onPress={handleRetake}
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 28,
                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: 'rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    <MaterialIcons name="refresh" size={24} color="#ef4444" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={togglePlayback}
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: theme.surface,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: theme.border
                                    }}
                                >
                                    <MaterialIcons
                                        name={isPlaying ? "pause" : "play-arrow"}
                                        size={40}
                                        color={theme.primary}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleConfirm}
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 28,
                                        backgroundColor: theme.success,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <MaterialIcons name="check" size={28} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Review your recording</Text>
                        </View>
                    )
                }

                {/* Record Button Container (Only show when NOT in review mode and NOT showing input) */}
                {
                    !reviewMode && !showInputForm && (
                        <View style={{ alignItems: 'center', marginTop: 40, minHeight: 180 }}>
                            {/* Ripple/Pulse Background */}
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: isRecording ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                                    transform: [{ scale: pulseAnim }],
                                    top: -20
                                }}
                            />

                            <TouchableOpacity
                                onPress={handleRecordToggle}
                                disabled={isSubmitting}
                                style={[
                                    captureStyles.recordButton,
                                    { backgroundColor: isRecording ? '#f43f5e' : theme.primary },
                                    isSubmitting && { opacity: 0.5 },
                                    { zIndex: 10 }
                                ]}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={48} color="#fff" />
                                )}
                            </TouchableOpacity>

                            {/* Timer and Status */}
                            <View style={{ marginTop: 24, alignItems: 'center' }}>
                                <Text style={{
                                    fontSize: 32,
                                    fontWeight: '700',
                                    color: isRecording ? '#f43f5e' : theme.text,
                                    fontVariant: ['tabular-nums']
                                }}>
                                    {formatDuration(recordingDuration)}
                                </Text>
                                <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 14 }}>
                                    {isSubmitting ? 'Uploading...' : isRecording ? 'Recording...' : 'Tap to start'}
                                </Text>

                                {!isRecording && (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const result = await MediaCapture.pickAudio();
                                            if (result.success && result.uri) {
                                                setLastCheckResult({ ...result, duration: 0 });
                                                setReviewMode(true);
                                            } else if (result.error && result.error !== 'Selection cancelled') {
                                                Alert.alert('Error', result.error);
                                            }
                                        }}
                                        style={{ marginTop: 32, flexDirection: 'row', alignItems: 'center' }}
                                    >
                                        <MaterialIcons name="file-upload" size={20} color={theme.primary} />
                                        <Text style={{ color: theme.primary, marginLeft: 8, fontWeight: '600' }}>Upload Audio File</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )
                }

                {/* Data Input Form (Shows after recording is confirmed) */}
                {
                    showInputForm && !isRecording && (
                        <View style={{ marginTop: 32 }}>
                            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18, marginBottom: 16 }}>
                                Add Context
                            </Text>

                            {/* Local Word Input */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 14 }}>What did you say? (The Word)</Text>
                                <TextInput
                                    style={[captureStyles.translationInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                    placeholder="e.g., 'Ubusuku' (Xhosa for Night)"
                                    placeholderTextColor={theme.textSecondary}
                                    value={localWord}
                                    onChangeText={setLocalWord}
                                />
                            </View>

                            {/* Cultural Context Input */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 14 }}>Cultural Meaning / Context</Text>
                                <TextInput
                                    style={[captureStyles.translationInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, minHeight: 100 }]}
                                    placeholder="Explain when this is used, or the deeper meaning..."
                                    placeholderTextColor={theme.textSecondary}
                                    value={culturalContext}
                                    onChangeText={setCulturalContext}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity
                                style={[captureStyles.submitButton, { backgroundColor: theme.primary }]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 1 }}>SUBMIT</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )
                }

                {/* Reward Info */}
                <View style={[captureStyles.rewardInfo, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 40 }]}>
                    <MaterialIcons name="account-balance-wallet" size={24} color={theme.success} />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Session Earnings</Text>
                        <Text style={{ color: theme.success, fontSize: 20, fontWeight: '700' }}>${sessionReward.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView >

            {/* Submission Loading Overlay */}
            {isSubmitting && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <View style={{
                        backgroundColor: theme.surface,
                        padding: 32,
                        borderRadius: 24,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10
                    }}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18, marginTop: 24 }}>Processing Audio Data</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>Finalizing your mission results...</Text>
                    </View>
                </View>
            )}

        </View >
    );
};
