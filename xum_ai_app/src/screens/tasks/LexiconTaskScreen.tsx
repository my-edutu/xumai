/**
 * XUM Lexicon Task Screen
 * Users name/define concepts in their local language with text, voice, or both.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../context/ThemeContext';
import { ScreenName } from '../../types';
import { createGlobalStyles } from '../../styles';
import { supabase } from '../../supabaseClient';
import { TaskService } from '../../services/taskService';
import { LexiconConcept } from '../../services/types';
import { QualityService } from '../../services/qualityService';

interface LexiconTaskScreenProps {
    onNavigate: (s: ScreenName) => void;
    session: any;
}

type InputMode = 'text' | 'voice' | 'both';


export const LexiconTaskScreen: React.FC<LexiconTaskScreenProps> = ({ onNavigate, session }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);

    const [concepts, setConcepts] = useState<LexiconConcept[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>('both');
    const [localWord, setLocalWord] = useState('');
    const [culturalNote, setCulturalNote] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [totalEarned, setTotalEarned] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const current = concepts[currentIndex];
    const bonusMultiplier = inputMode === 'both' ? 1.5 : 1;

    useEffect(() => {
        loadConcepts();
        return () => {
            if (recording) recording.stopAndUnloadAsync();
        };
    }, []);

    const loadConcepts = async () => {
        if (!session?.user?.id) return;
        setIsLoading(true);
        try {
            const data = await TaskService.getAvailableLexiconConcepts(session.user.id);
            setConcepts(data);
        } catch (e) {
            console.warn('Failed to load concepts', e);
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                Alert.alert('Permission Required', 'Microphone access is needed for voice recording.');
                return;
            }

            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording: rec } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(rec);
            setIsRecording(true);
            setRecordingDuration(0);

            const interval = setInterval(() => {
                setRecordingDuration(prev => {
                    if (prev >= 30) {
                        stopRecording();
                        clearInterval(interval);
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            Alert.alert('Error', 'Could not start recording.');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setIsRecording(false);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecordingUri(uri);
            setRecording(null);
        } catch (err) {
            console.warn('Stop recording error:', err);
        }
    };

    const uploadVoice = async (): Promise<string | null> => {
        if (!recordingUri || !supabase || !session?.user?.id) return null;
        try {
            const fileExt = 'm4a';
            const fileName = `lexicon/${session.user.id}/${current.id}_${Date.now()}.${fileExt}`;
            const base64 = await FileSystem.readAsStringAsync(recordingUri, { encoding: 'base64' });
            const { data, error } = await supabase.storage
                .from('voice')
                .upload(fileName, Buffer.from(base64, 'base64'), { contentType: 'audio/m4a' });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('voice').getPublicUrl(fileName);
            return publicUrl;
        } catch (err) {
            console.warn('Voice upload error:', err);
            return null;
        }
    };

    const handleSubmit = async () => {
        if (inputMode !== 'voice' && !localWord.trim()) {
            Alert.alert('Required', 'Please enter the word in your local language.');
            return;
        }
        if (inputMode !== 'text' && !recordingUri) {
            Alert.alert('Required', 'Please record the pronunciation.');
            return;
        }

        setIsSubmitting(true);
        try {
            let pronunciationUrl: string | null = null;
            if (recordingUri) {
                pronunciationUrl = await uploadVoice();
            }

            const reward = current.reward * bonusMultiplier;

            let qualityScore = null;
            let audioSnr = null;
            let audioClarity = null;

            if (recordingUri) {
                const analysis = await QualityService.analyzeAudioQuality(recordingUri);
                qualityScore = analysis.overall;
                audioSnr = analysis.snr;
                audioClarity = analysis.clarity;

                if (analysis.isSilenced) {
                    Alert.alert('Low Quality', 'The recording seems too quiet or silent. Please try again in a quieter area or speak closer to the mic.');
                    setIsSubmitting(false);
                    return;
                }
            }

            if (supabase && session?.user?.id) {
                await supabase.from('lexicon_submissions').insert({
                    user_id: session.user.id,
                    concept_id: current.id,
                    concept: current.word,
                    local_word: localWord.trim(),
                    cultural_note: culturalNote.trim(),
                    pronunciation_url: pronunciationUrl,
                    input_mode: inputMode,
                    reward,
                    audio_snr: audioSnr,
                    audio_clarity: audioClarity,
                    quality_score: qualityScore,
                    submitted_at: new Date().toISOString(),
                });
            }

            setTotalEarned(prev => prev + (current.reward * bonusMultiplier));
            setSubmitted(true);

            setTimeout(() => {
                setSubmitted(false);
                setLocalWord('');
                setCulturalNote('');
                setRecordingUri(null);
                setRecordingDuration(0);
                if (currentIndex < concepts.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    Alert.alert(
                        'Lexicon Session Complete!',
                        `Total earned: $${totalEarned.toFixed(2)}`,
                        [{ text: 'Done', onPress: () => onNavigate(ScreenName.HOME) }]
                    );
                }
            }, 1500);
        } catch (err) {
            Alert.alert('Error', 'Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>XUM LEXICON</Text>
                <View style={{ backgroundColor: `${theme.success}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Text style={{ color: theme.success, fontSize: 11, fontWeight: '700' }}>+${totalEarned.toFixed(2)}</Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 60 }} />
            ) : concepts.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <MaterialIcons name="done-all" size={64} color={theme.primary} />
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
                        All caught up!
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                        There are no new concepts for you to define right now. Check back later!
                    </Text>
                    <TouchableOpacity
                        onPress={() => onNavigate(ScreenName.HOME)}
                        style={[styles.buttonPrimary, { marginTop: 24, width: '100%' }]}
                    >
                        <Text style={styles.buttonText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Progress */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ flex: 1, height: 4, backgroundColor: theme.border, borderRadius: 2 }}>
                            <View style={{
                                height: 4,
                                width: `${((currentIndex + 1) / concepts.length) * 100}%`,
                                backgroundColor: theme.primary,
                                borderRadius: 2,
                            }} />
                        </View>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 12 }}>
                            {currentIndex + 1}/{concepts.length}
                        </Text>
                    </View>

                    {/* Concept Card */}
                    <View style={{
                        backgroundColor: theme.surface,
                        borderRadius: 20,
                        padding: 28,
                        alignItems: 'center',
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <Text style={{ fontSize: 72, marginBottom: 12 }}>{current?.emoji}</Text>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: 1 }}>
                            {current?.word}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                            <View style={{ backgroundColor: `${theme.primary}20`, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>{current?.category}</Text>
                            </View>
                            <View style={{ backgroundColor: `${theme.success}20`, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                                <Text style={{ color: theme.success, fontSize: 12, fontWeight: '700' }}>
                                    ${(current?.reward * bonusMultiplier).toFixed(2)}
                                    {inputMode === 'both' ? ' 🔥' : ''}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Input Mode Selection */}
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                        Input Mode
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                        {([
                            { mode: 'text' as InputMode, label: '✍️ Text', desc: 'Word only' },
                            { mode: 'voice' as InputMode, label: '🎙 Voice', desc: 'Audio only' },
                            { mode: 'both' as InputMode, label: '⚡ Both', desc: '1.5x reward' },
                        ] as const).map(({ mode, label, desc }) => (
                            <TouchableOpacity
                                key={mode}
                                onPress={() => setInputMode(mode)}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    borderRadius: 14,
                                    borderWidth: 2,
                                    borderColor: inputMode === mode ? theme.primary : theme.border,
                                    backgroundColor: inputMode === mode ? `${theme.primary}10` : theme.surface,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 16, marginBottom: 4 }}>{label}</Text>
                                <Text style={{ fontSize: 10, color: mode === 'both' ? theme.success : theme.textSecondary, fontWeight: '600' }}>{desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Text Input */}
                    {(inputMode === 'text' || inputMode === 'both') && (
                        <>
                            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                                What is "{current?.word}" in your language? <Text style={{ color: '#f43f5e' }}>*</Text>
                            </Text>
                            <TextInput
                                style={{
                                    backgroundColor: theme.surface,
                                    borderRadius: 14,
                                    padding: 16,
                                    fontSize: 18,
                                    fontWeight: '700',
                                    color: theme.text,
                                    borderWidth: 1,
                                    borderColor: localWord ? theme.primary : theme.border,
                                    marginBottom: 16,
                                }}
                                placeholder="Enter the word..."
                                placeholderTextColor={theme.textSecondary}
                                value={localWord}
                                onChangeText={setLocalWord}
                            />
                            <TextInput
                                style={{
                                    backgroundColor: theme.surface,
                                    borderRadius: 14,
                                    padding: 16,
                                    fontSize: 15,
                                    color: theme.text,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    minHeight: 80,
                                    textAlignVertical: 'top',
                                    marginBottom: 16,
                                }}
                                placeholder="Cultural note — what does it mean in your context? (optional)"
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                value={culturalNote}
                                onChangeText={setCulturalNote}
                            />
                        </>
                    )}

                    {/* Voice Input */}
                    {(inputMode === 'voice' || inputMode === 'both') && (
                        <>
                            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                                Record Pronunciation <Text style={{ color: '#f43f5e' }}>*</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={isRecording ? stopRecording : startRecording}
                                style={{
                                    backgroundColor: isRecording ? `rgba(244, 63, 94, 0.1)` : `${theme.primary}10`,
                                    borderRadius: 16,
                                    padding: 20,
                                    alignItems: 'center',
                                    borderWidth: 2,
                                    borderColor: isRecording ? '#f43f5e' : (recordingUri ? theme.success : theme.border),
                                    marginBottom: 20,
                                }}
                            >
                                <MaterialIcons
                                    name={isRecording ? 'stop' : (recordingUri ? 'check-circle' : 'mic')}
                                    size={40}
                                    color={isRecording ? '#f43f5e' : (recordingUri ? theme.success : theme.primary)}
                                />
                                <Text style={{
                                    color: isRecording ? '#f43f5e' : (recordingUri ? theme.success : theme.text),
                                    fontWeight: '700',
                                    marginTop: 8,
                                }}>
                                    {isRecording
                                        ? `Recording... ${recordingDuration}s (tap to stop)`
                                        : recordingUri
                                            ? '✓ Recorded — tap to re-record'
                                            : 'Tap to record pronunciation'
                                    }
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            backgroundColor: theme.primary,
                            borderRadius: 14,
                            padding: 18,
                            alignItems: 'center',
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialIcons name="send" size={20} color="#fff" />
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                                    Submit (+${(current?.reward * bonusMultiplier).toFixed(2)})
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
};
