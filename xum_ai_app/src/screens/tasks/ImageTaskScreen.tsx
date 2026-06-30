import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTask } from '../../hooks/useTask';
import { MediaCapture } from '../../services/mediaCapture';
import { runPreCheck } from '../../services/preCheckService';
import { ScreenName } from '../../types';
import { createGlobalStyles, createCaptureStyles } from '../../styles';

interface ImageTaskScreenProps {
    onNavigate: (screen: ScreenName) => void;
    session?: { user: { id: string } | null };
    campaignId?: string;
}

export const ImageTaskScreen: React.FC<ImageTaskScreenProps> = ({ onNavigate, session, campaignId }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);
    const captureStyles = createCaptureStyles(theme);
    const {
        currentPrompt,
        completedTasks,
        isLoading,
        isSubmitting,
        showSuccess,
        sessionReward,
        error,
        submitTask,
        skipPrompt
    } = useTask({
        taskType: 'image',
        tasksPerSession: 5,
        initialUserId: session?.user?.id ?? undefined,
        campaignId: campaignId
    });

    const [description, setDescription] = useState('');
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number>(0);

    const screenWidth = Dimensions.get('window').width;

    // Run pre-check after image is captured and set state
    const applyImageWithPreCheck = async (uri: string, size: number) => {
        const userId = session?.user?.id;
        if (userId) {
            const checkResult = await runPreCheck(uri, 'image', userId, size || undefined);
            if (!checkResult.passed) {
                Alert.alert(
                    'Quality Check Failed',
                    checkResult.flags.join('\n\n'),
                    [
                        { text: 'Retake', style: 'cancel' },
                        {
                            text: 'Continue Anyway', style: 'destructive', onPress: () => {
                                setCapturedUri(uri);
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
        setCapturedUri(uri);
        setFileSize(size);
    };

    // Handle image capture
    const handleCapture = async () => {
        const result = await MediaCapture.captureImage();

        if (result.success && result.uri) {
            await applyImageWithPreCheck(result.uri, result.size || 0);
        } else if (result.error && result.error !== 'Capture cancelled') {
            Alert.alert('Error', result.error);
        }
    };

    // Handle gallery selection
    const handlePickFromGallery = async () => {
        const result = await MediaCapture.pickImage();

        if (result.success && result.uri) {
            await applyImageWithPreCheck(result.uri, result.size || 0);
        } else if (result.error && result.error !== 'Selection cancelled') {
            Alert.alert('Error', result.error);
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
                fileSize,
                collectedMetadata: { platform: Platform.OS, consent_given: true },
            }
        );

        if (success) {
            setDescription('');
            setCapturedUri(null);
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
                        <MaterialIcons name="check" size={56} color="#fff" />
                    </View>
                    <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 16 }}>Mission Success!</Text>
                    <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 32 }}>You captured 5 high-quality images</Text>
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>IMAGE TASK</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Progress */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Progress</Text>
                        <Text style={{ color: theme.primary, fontWeight: '600' }}>{completedTasks}/5 photos</Text>
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
                            <Text style={{ color: theme.success, fontWeight: '600', fontSize: 12 }}>REWARD: ${currentPrompt.base_reward.toFixed(2)}</Text>
                        </View>
                    </View>
                )}

                {/* Capture Area */}
                {capturedUri ? (
                    <View style={{ marginTop: 24 }}>
                        <View style={{ width: '100%', height: 250, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }}>
                            <Image source={{ uri: capturedUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            <TouchableOpacity
                                onPress={() => setCapturedUri(null)}
                                style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, p: 4 }}
                            >
                                <MaterialIcons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 24 }}>
                            <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 12 }}>Environment/Place/Location (Optional)</Text>
                            <TextInput
                                style={[captureStyles.translationInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                placeholder="e.g., Street view, kitchen, store..."
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
                            <MaterialIcons name="camera-alt" size={48} color="#fff" />
                        </TouchableOpacity>
                        <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 14 }}>Tap to open camera</Text>

                        <TouchableOpacity
                            onPress={handlePickFromGallery}
                            style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center' }}
                        >
                            <MaterialIcons name="photo-library" size={20} color={theme.primary} />
                            <Text style={{ color: theme.primary, marginLeft: 8, fontWeight: '600' }}>Upload from Gallery</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Reward Info */}
                <View style={[captureStyles.rewardInfo, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 40 }]}>
                    <MaterialIcons name="stars" size={24} color={theme.success} />
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
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18, marginTop: 24 }}>Uploading Mission Data</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>Please do not close the app</Text>
                    </View>
                </View>
            )}

        </View>
    );
};
