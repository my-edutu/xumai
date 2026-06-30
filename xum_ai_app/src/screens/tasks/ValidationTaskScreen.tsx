import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    TextInput,
    StyleSheet,
    Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ScreenName } from '../../types';
import { createGlobalStyles, createCaptureStyles } from '../../styles';
import { LinearGradient } from 'expo-linear-gradient';
import * as ValidationService from '../../services/validationService';
import { SubmissionToValidate } from '../../services/validationService';
import { Audio } from 'expo-av';
import { Image } from 'react-native';

interface ValidationTaskScreenProps {
    onNavigate: (screen: ScreenName) => void;
    session: any;
}

export const ValidationTaskScreen: React.FC<ValidationTaskScreenProps> = ({ onNavigate, session }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);
    const captureStyles = createCaptureStyles(theme);

    const [isLoading, setIsLoading] = useState(true);
    const [currentTask, setCurrentTask] = useState<SubmissionToValidate | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionEarnings, setSessionEarnings] = useState(0);
    const [vote, setVote] = useState<'approve' | 'reject' | null>(null);
    const [reason, setReason] = useState('');
    const [sound, setSound] = useState<Audio.Sound | null>(null);


    // Load initial task
    useEffect(() => {
        loadNextTask();
    }, []);

    const loadNextTask = async () => {
        if (!session?.user?.id) return;
        setIsLoading(true);
        setVote(null);
        setReason('');

        try {
            const task = await ValidationService.getNextSubmissionToValidate(session.user.id);
            setCurrentTask(task);
        } catch (e) {
            console.warn('Failed to load validation task', e);
        } finally {
            setIsLoading(false);
        }
    };


    const handleSubmit = async () => {
        if (!currentTask || !vote || !session?.user?.id) return;
        setIsSubmitting(true);

        try {
            const { success, error } = await ValidationService.submitValidationVote(
                currentTask.id,
                session.user.id,
                currentTask.submission_type,
                vote,
                3, // Default confidence
                reason
            );

            if (success) {
                setSessionEarnings(prev => prev + currentTask.reward);
                loadNextTask();
            } else {
                console.warn('Submission failed:', error);
            }
        } catch (e) {
            console.warn('Submission error', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const playAudio = async (url: string) => {
        try {
            if (sound) await sound.unloadAsync();
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: url });
            setSound(newSound);
            await newSound.playAsync();
        } catch (e) {
            console.warn('Error playing audio', e);
        }
    };


    if (isLoading && !currentTask) {
        return (
            <View style={[styles.screenContainer, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Loading comparison task...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>XUM JUDGE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: theme.success, fontWeight: '700', marginRight: 4 }}>
                        ${sessionEarnings.toFixed(2)}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {!currentTask ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                        <MaterialIcons name="fact-check" size={64} color={theme.primary} />
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
                            All tasks validated!
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                            You have reviewed all pending submissions. Good job!
                        </Text>
                        <TouchableOpacity
                            onPress={() => onNavigate(ScreenName.HOME)}
                            style={[styles.buttonPrimary, { marginTop: 24, width: '100%' }]}
                        >
                            <Text style={styles.buttonText}>Finish Session</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={{ marginBottom: 24 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <View style={{ backgroundColor: `${theme.primary}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                    <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '700' }}>
                                        {currentTask.submission_type.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 8 }}>
                                    {currentTask.submission_type === 'lexicon' ? 'Lexicon Validation' : 'Compare AI Responses'}
                                </Text>
                            </View>
                            <Text style={[captureStyles.heroTitle, { color: theme.text, fontSize: 22, lineHeight: 28 }]}>{currentTask.prompt}</Text>
                        </View>

                        {currentTask.submission_type === 'lexicon' ? (
                            <View style={[localStyles.responseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Local Definition:</Text>
                                <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800', marginBottom: 12 }}>
                                    {currentTask.details.local_word}
                                </Text>

                                {currentTask.details.cultural_note && (
                                    <View style={{ backgroundColor: `${theme.background}80`, padding: 12, borderRadius: 12, marginBottom: 12 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 4 }}>Cultural Note:</Text>
                                        <Text style={{ color: theme.text, fontSize: 14 }}>{currentTask.details.cultural_note}</Text>
                                    </View>
                                )}

                                {currentTask.details.pronunciation_url && (
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                                        onPress={() => playAudio(currentTask.details.pronunciation_url!)}
                                    >
                                        <MaterialIcons name="play-arrow" size={20} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Listen Pronunciation</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : currentTask.submission_type === 'rlhf' ? (
                            <View style={localStyles.comparisonContainer}>
                                <View style={[localStyles.responseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>Original/Corrected Comparison:</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 13, textDecorationLine: 'line-through' }}>{currentTask.details.original_response}</Text>
                                    <Text style={{ color: theme.text, fontSize: 15, marginTop: 8, fontWeight: '600' }}>{currentTask.details.corrected_response}</Text>
                                    <View style={{ marginTop: 12, padding: 8, backgroundColor: `${theme.success}10`, borderRadius: 8 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Reason:</Text>
                                        <Text style={{ color: theme.text, fontSize: 12 }}>{currentTask.details.correction_reason}</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            /* Generic Submission UI */
                            <View style={[localStyles.responseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                {currentTask.details.file_url && (currentTask.task_type === 'image' || currentTask.task_type === 'photo') ? (
                                    <Image
                                        source={{ uri: currentTask.details.file_url }}
                                        style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }}
                                        resizeMode="contain"
                                    />
                                ) : currentTask.details.file_url && (currentTask.task_type === 'audio' || currentTask.task_type === 'voice') ? (
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 16 }}
                                        onPress={() => playAudio(currentTask.details.file_url!)}
                                    >
                                        <MaterialIcons name="play-circle-outline" size={24} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Play Recording</Text>
                                    </TouchableOpacity>
                                ) : null}

                                {currentTask.details.translation_text && (
                                    <View style={{ backgroundColor: `${theme.background}80`, padding: 16, borderRadius: 12 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 4 }}>Translation/Result:</Text>
                                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{currentTask.details.translation_text}</Text>
                                    </View>
                                )}

                                {currentTask.details.description && (
                                    <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 12 }}>
                                        {currentTask.details.description}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Judgment Controls */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                            <TouchableOpacity
                                onPress={() => setVote('approve')}
                                style={[
                                    localStyles.voteButton,
                                    {
                                        backgroundColor: vote === 'approve' ? theme.success : theme.surface,
                                        borderColor: vote === 'approve' ? theme.success : theme.border,
                                    }
                                ]}
                            >
                                <MaterialIcons name="check" size={24} color={vote === 'approve' ? '#fff' : theme.success} />
                                <Text style={{ color: vote === 'approve' ? '#fff' : theme.text, fontWeight: '700', marginTop: 4 }}>Approve</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setVote('reject')}
                                style={[
                                    localStyles.voteButton,
                                    {
                                        backgroundColor: vote === 'reject' ? theme.error : theme.surface,
                                        borderColor: vote === 'reject' ? theme.error : theme.border,
                                    }
                                ]}
                            >
                                <MaterialIcons name="close" size={24} color={vote === 'reject' ? '#fff' : theme.error} />
                                <Text style={{ color: vote === 'reject' ? '#fff' : theme.text, fontWeight: '700', marginTop: 4 }}>Reject</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Reasoning Input */}
                        {vote === 'reject' && (
                            <View style={{ marginTop: 24, marginBottom: 24 }}>
                                <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 12 }}>
                                    Reason for rejection (Optional)
                                </Text>
                                <TextInput
                                    style={[captureStyles.translationInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, minHeight: 80 }]}
                                    placeholder="e.g., Inaccurate definition, poor audio quality..."
                                    placeholderTextColor={theme.textSecondary}
                                    value={reason}
                                    onChangeText={setReason}
                                    multiline
                                />
                            </View>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                captureStyles.submitButton,
                                { backgroundColor: vote ? theme.primary : theme.border, opacity: vote ? 1 : 0.5, marginTop: 24 }
                            ]}
                            onPress={handleSubmit}
                            disabled={!vote || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>SUBMIT JUDGMENT</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 24, fontSize: 12 }}>
                            Reward: ${currentTask.reward.toFixed(2)} • Quality checked by Senior Judges
                        </Text>
                    </>
                )}

            </ScrollView>
        </View>
    );
};

const localStyles = StyleSheet.create({
    comparisonContainer: {
        gap: 16,
    },
    responseCard: {
        borderWidth: 2,
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        minHeight: 120,
        justifyContent: 'center'
    },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    responseText: {
        fontSize: 15,
        lineHeight: 22,
        marginTop: 16, // Space for badge
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4
    },
    voteButton: {
        flex: 1,
        borderWidth: 2,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
