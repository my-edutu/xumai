/**
 * XUM Judge — RLHF Correction Screen
 * Advanced task: user rewrites or corrects AI responses with cultural context.
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
import { useTheme } from '../../context/ThemeContext';
import { ScreenName } from '../../types';
import { createGlobalStyles } from '../../styles';
import { supabase } from '../../supabaseClient';

interface RLHFCorrectionScreenProps {
    onNavigate: (s: ScreenName) => void;
    session: any;
}


const CULTURAL_REGIONS = [
    'West Africa', 'East Africa', 'Southern Africa', 'North Africa',
    'South Asia', 'Southeast Asia', 'Latin America', 'Middle East', 'Other',
];

export const RLHFCorrectionScreen: React.FC<RLHFCorrectionScreenProps> = ({ onNavigate, session }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);

    const [tasks, setTasks] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [correction, setCorrection] = useState('');
    const [reason, setReason] = useState('');
    const [culturalRegion, setCulturalRegion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [totalEarned, setTotalEarned] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const current = tasks[currentIndex];

    useEffect(() => {
        loadTasks();
    }, [session?.user?.id]);

    const loadTasks = async () => {
        if (!session?.user?.id || !supabase) return;
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('rlhf_tasks')
                .select('*')
                .eq('task_type', 'correction')
                .eq('status', 'active')
                .limit(10);
            if (data && data.length > 0) {
                setTasks(data);
            }
        } catch (e) {
            // No fallback — show empty state
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!correction.trim()) {
            Alert.alert('Required', 'Please provide your corrected response.');
            return;
        }
        if (!culturalRegion) {
            Alert.alert('Required', 'Please select your cultural region.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (supabase && session?.user?.id) {
                await supabase.from('rlhf_submissions').insert({
                    user_id: session.user.id,
                    task_id: current.id,
                    original_response: current.ai_response,
                    corrected_response: correction,
                    correction_reason: reason,
                    cultural_region: culturalRegion,
                    reward: current.reward,
                    submitted_at: new Date().toISOString(),
                });
            }

            setTotalEarned(prev => prev + current.reward);
            setSubmitted(true);

            setTimeout(() => {
                setSubmitted(false);
                setCorrection('');
                setReason('');
                setCulturalRegion('');
                if (currentIndex < tasks.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    Alert.alert(
                        'Session Complete!',
                        `You completed all correction tasks. Total earned: $${totalEarned.toFixed(2)}`,
                        [{ text: 'Done', onPress: () => onNavigate(ScreenName.XUM_JUDGE) }]
                    );
                }
            }, 1500);
        } catch (err) {
            Alert.alert('Error', 'Failed to submit. Please try again.');
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
                <TouchableOpacity onPress={() => onNavigate(ScreenName.XUM_JUDGE)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>RLHF CORRECTION</Text>
                <View style={{
                    backgroundColor: `${theme.success}20`,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                }}>
                    <Text style={{ color: theme.success, fontSize: 11, fontWeight: '700' }}>
                        +${totalEarned.toFixed(2)}
                    </Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 60 }} />
            ) : tasks.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <MaterialIcons name="auto-fix-high" size={56} color={theme.textSecondary} style={{ marginBottom: 16 }} />
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
                        No Tasks Available
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
                        New RLHF correction tasks will appear here when they are published. Check back soon!
                    </Text>
                    <TouchableOpacity
                        onPress={() => onNavigate(ScreenName.XUM_JUDGE)}
                        style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: theme.primary }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Back to XUM Judge</Text>
                    </TouchableOpacity>
                </View>
            ) : submitted ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: `${theme.success}20`,
                        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                    }}>
                        <MaterialIcons name="check-circle" size={48} color={theme.success} />
                    </View>
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>Correction Submitted!</Text>
                    <Text style={{ color: theme.success, fontSize: 22, fontWeight: '800', marginTop: 8 }}>
                        +${current?.reward.toFixed(2)}
                    </Text>
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
                                width: `${((currentIndex + 1) / tasks.length) * 100}%`,
                                backgroundColor: theme.primary,
                                borderRadius: 2,
                            }} />
                        </View>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 12 }}>
                            {currentIndex + 1}/{tasks.length}
                        </Text>
                    </View>

                    {/* Task Info */}
                    <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
                        <View style={{ backgroundColor: `${theme.primary}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                            <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700' }}>{current?.category}</Text>
                        </View>
                        <View style={{ backgroundColor: `${theme.success}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                            <Text style={{ color: theme.success, fontSize: 11, fontWeight: '700' }}>${current?.reward.toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Prompt Box */}
                    <View style={{
                        backgroundColor: theme.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        borderLeftWidth: 3,
                        borderLeftColor: theme.primary,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
                            PROMPT
                        </Text>
                        <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>{current?.prompt}</Text>
                    </View>

                    {/* AI Response Box */}
                    <View style={{
                        backgroundColor: `rgba(244, 63, 94, 0.06)`,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(244, 63, 94, 0.2)',
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <MaterialIcons name="smart-toy" size={16} color="#f43f5e" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#f43f5e', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                                AI RESPONSE (NEEDS CORRECTION)
                            </Text>
                        </View>
                        <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>{current?.ai_response}</Text>
                    </View>

                    {/* Cultural Region Selector */}
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                        Your Cultural Region <Text style={{ color: '#f43f5e' }}>*</Text>
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        {CULTURAL_REGIONS.map((region) => (
                            <TouchableOpacity
                                key={region}
                                onPress={() => setCulturalRegion(region)}
                                style={{
                                    paddingVertical: 8,
                                    paddingHorizontal: 14,
                                    borderRadius: 20,
                                    borderWidth: 2,
                                    borderColor: culturalRegion === region ? theme.primary : theme.border,
                                    backgroundColor: culturalRegion === region ? `${theme.primary}15` : theme.background,
                                    marginRight: 8,
                                }}
                            >
                                <Text style={{
                                    fontSize: 13,
                                    fontWeight: '600',
                                    color: culturalRegion === region ? theme.primary : theme.textSecondary
                                }}>
                                    {region}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Corrected Response */}
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                        Your Corrected Response <Text style={{ color: '#f43f5e' }}>*</Text>
                    </Text>
                    <TextInput
                        style={{
                            backgroundColor: theme.surface,
                            borderRadius: 14,
                            padding: 16,
                            fontSize: 15,
                            color: theme.text,
                            borderWidth: 1,
                            borderColor: correction ? theme.primary : theme.border,
                            minHeight: 120,
                            textAlignVertical: 'top',
                            marginBottom: 16,
                        }}
                        placeholder="Rewrite the AI response with accurate cultural context..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        value={correction}
                        onChangeText={setCorrection}
                    />

                    {/* Reason */}
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                        Reason for Correction (Optional)
                    </Text>
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
                            marginBottom: 24,
                        }}
                        placeholder="Explain why the original was incorrect..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        value={reason}
                        onChangeText={setReason}
                    />

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
                                    Submit Correction (+${current?.reward.toFixed(2)})
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
};
