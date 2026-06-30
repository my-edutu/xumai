import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
} from 'react-native';
import { useCameraPermissions, launchCameraAsync, UIImagePickerControllerQualityType } from 'expo-image-picker';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../context/ThemeContext';
import { useTask } from '../../hooks/useTask';
import { MediaCapture } from '../../services/mediaCapture';
import { runPreCheck } from '../../services/preCheckService';
import { ScreenName } from '../../types';
import { createGlobalStyles, createCaptureStyles } from '../../styles';

interface VideoTaskScreenProps {
    onNavigate: (screen: ScreenName) => void;
    session?: { user: { id: string } | null };
    campaignId?: string;
}

export const VideoTaskScreen: React.FC<VideoTaskScreenProps> = ({ onNavigate, session, campaignId }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);
    const captureStyles = createCaptureStyles(theme);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
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
        taskType: 'video',
        tasksPerSession: 5,
        initialUserId: session?.user?.id ?? undefined,
        campaignId: campaignId
    });

    const [description, setDescription] = useState('');
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [fileSize, setFileSize] = useState<number>(0);

    // Handle video capture
    const handleCapture = async () => {
        try {
            // 1. Camera Permissions
            if (!cameraPermission?.granted) {
                const permissionResponse = await requestCameraPermission();
                if (!permissionResponse.granted) {
                    Alert.alert('Permission Required', 'Camera access is needed to record video.');
                    return;
                }
            }

            // 2. Audio Permissions
            const audioStatus = await Audio.requestPermissionsAsync();
            if (!audioStatus.granted) {
                Alert.alert('Permission Required', 'Microphone access is needed for video audio.');
                return;
            }

            // 3. Launch Camera directly
            const result = await launchCameraAsync({
                mediaTypes: ['videos'],
                videoMaxDuration: 15,
                quality: UIImagePickerControllerQualityType.Medium,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const durationSeconds = asset.duration ? Math.round(asset.duration / 1000) : 0;

                // Get file size
                const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                const size = fileInfo.exists ? (fileInfo as any).size : 0;

                // Pre-check before accepting the video
                const userId = session?.user?.id;
                if (userId) {
                    const checkResult = await runPreCheck(asset.uri, 'video', userId, size, durationSeconds);
                    if (!checkResult.passed) {
                        Alert.alert(
                            'Quality Check Failed',
                            checkResult.flags.join('\n\n'),
                            [
                                { text: 'Retake', style: 'cancel' },
                                {
                                    text: 'Continue Anyway', style: 'destructive', onPress: () => {
                                        setCapturedUri(asset.uri);
                                        setDuration(durationSeconds);
                                        setFileSize(size);
                                    }
                                },
                            ]
                        );
                        return;
                    }
                    if (checkResult.warnings.length > 0) {
                        Alert.alert('Warning', checkResult.warnings.join('\n'));
                    }
                }

                setCapturedUri(asset.uri);
                setDuration(durationSeconds);
                setFileSize(size);

            } else if (!result.canceled) {
                // Cancelled logic
            }
        } catch (err: any) {
            console.error('Video capture error:', err);
            // The error "unregistered ActivityResultLauncher" might still happen if the hook didn't register it correctly?
            // But using the hook sets up the listener.
            Alert.alert('Error', err.message || 'Failed to capture video');
        }
    };

    // Submit with auto-captured system metadata (no user prompt)
    const handleSubmit = async () => {
        if (!capturedUri) return;

        const success = await submitTask(
            capturedUri,
            undefined,
            {
                description,
                durationSeconds: duration,
                fileSize,
                collectedMetadata: { platform: Platform.OS, consent_given: true },
            }
        );

        if (success) {
            setDescription('');
            setCapturedUri(null);
            setDuration(0);
            setFileSize(0);
        } else if (error) {
            Alert.alert('Submission Failed', error);
        }
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
                        <MaterialIcons name="videocam" size={56} color="#fff" />
                    </View>
                    <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 16 }}>Excellent!</Text>
                    <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 32 }}>You completed the video session</Text>
                    <Text style={{ fontSize: 40, fontWeight: '700', color: theme.success }}>${sessionReward.toFixed(2)}</Text>
                    <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8 }}>Added to your wallet</Text>

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>VIDEO TASK</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Progress */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Progress</Text>
                        <Text style={{ color: theme.primary, fontWeight: '600' }}>{completedTasks}/3 video tasks</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: theme.surface, borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ height: 8, backgroundColor: theme.primary, width: `${(completedTasks / 3) * 100}%` }} />
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
                            <Text style={{ color: theme.success, fontWeight: '600', fontSize: 12 }}>REWARD: ${currentPrompt.base_reward.toFixed(2)}</Text>
                        </View>
                    </View>
                )}

                {/* Capture Area */}
                {capturedUri ? (
                    <View style={{ marginTop: 24 }}>
                        <View style={{
                            width: '100%',
                            height: 250,
                            borderRadius: 16,
                            overflow: 'hidden',
                            backgroundColor: '#000',
                            borderColor: theme.border,
                            borderWidth: 1,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <MaterialIcons name="play-circle-filled" size={64} color="#fff" />
                            <Text style={{ color: '#fff', marginTop: 8 }}>Video Recorded ({duration}s)</Text>

                            <TouchableOpacity
                                onPress={() => setCapturedUri(null)}
                                style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 }}
                            >
                                <MaterialIcons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 24 }}>
                            <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 12 }}>Environment/Place/Location (Optional)</Text>
                            <TextInput
                                style={[captureStyles.translationInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                placeholder="e.g., Living room, park, office..."
                                placeholderTextColor={theme.textSecondary}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />
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
                    </View>
                ) : (
                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={handleCapture}
                            disabled={isSubmitting}
                            style={[captureStyles.recordButton, { backgroundColor: theme.primary }, isSubmitting && { opacity: 0.5 }]}
                        >
                            <MaterialIcons name="videocam" size={48} color="#fff" />
                        </TouchableOpacity>
                        <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 14 }}>Tap to start video capture</Text>
                        <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 12 }}>Max duration: 15 seconds</Text>

                        <TouchableOpacity
                            onPress={async () => {
                                const result = await MediaCapture.pickVideo();
                                if (result.success && result.uri) {
                                    setCapturedUri(result.uri);
                                    setDuration(result.duration || 0);
                                    setFileSize(result.size || 0);
                                } else if (result.error && result.error !== 'Selection cancelled') {
                                    Alert.alert('Error', result.error);
                                }
                            }}
                            style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center' }}
                        >
                            <MaterialIcons name="movie" size={20} color={theme.primary} />
                            <Text style={{ color: theme.primary, marginLeft: 8, fontWeight: '600' }}>Upload Video from Gallery</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Reward Info */}
                <View style={[captureStyles.rewardInfo, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 40 }]}>
                    <MaterialIcons name="trending-up" size={24} color={theme.success} />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Session Earnings</Text>
                        <Text style={{ color: theme.success, fontSize: 20, fontWeight: '700' }}>${sessionReward.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

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
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18, marginTop: 24 }}>Uploading Video Data</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>This may take a moment for large files</Text>
                    </View>
                </View>
            )}

        </View>
    );
};
