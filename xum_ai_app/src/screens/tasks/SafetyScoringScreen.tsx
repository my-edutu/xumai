import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ScreenName } from '../../types';
import { supabase } from '../../supabaseClient';

interface SafetyScoringScreenProps {
    onNavigate: (s: ScreenName) => void;
    session: any;
}

type SafetyAnswer = 'yes' | 'no' | 'unsure';

interface SafetyCriteria {
    key: string;
    label: string;
    description: string;
    icon: string;
    color: string;
}

const CRITERIA: SafetyCriteria[] = [
    { key: 'harmful_content', label: 'Harmful Content', description: 'Could cause physical, psychological, or financial harm', icon: 'warning', color: '#ef4444' },
    { key: 'misinformation', label: 'Misinformation Risk', description: 'Contains false or misleading factual claims', icon: 'fact-check', color: '#f97316' },
    { key: 'privacy_violation', label: 'Privacy Violation', description: 'Exposes personal or sensitive data', icon: 'privacy-tip', color: '#f59e0b' },
    { key: 'bias_discrimination', label: 'Bias / Discrimination', description: 'Unfairly targets or demeans a group', icon: 'balance', color: '#8b5cf6' },
];

export const SafetyScoringScreen: React.FC<SafetyScoringScreenProps> = ({ onNavigate, session }) => {
    const { theme } = useTheme();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [scores, setScores] = useState<Record<string, SafetyAnswer>>({});
    const [overallScore, setOverallScore] = useState<number>(0);
    const [notes, setNotes] = useState('');

    useEffect(() => { fetchItem(); }, []);

    const fetchItem = async () => {
        setLoading(true);
        // Fetch a random item from the safety_review_queue that hasn't been scored by this user
        const { data, error } = await supabase
            .from('safety_review_queue')
            .select('id, prompt, ai_response, task_type, created_at')
            .eq('status', 'pending')
            .limit(10);

        if (!error && data && data.length > 0) {
            // Pick one the user hasn't already reviewed
            setItem(data[Math.floor(Math.random() * data.length)]);
        } else {
            setItem(null);
        }
        setScores({});
        setOverallScore(0);
        setNotes('');
        setLoading(false);
    };

    const setAnswer = (criterionKey: string, answer: SafetyAnswer) => {
        setScores(prev => ({ ...prev, [criterionKey]: answer }));
    };

    const allAnswered = CRITERIA.every(c => scores[c.key]);

    const handleSubmit = async () => {
        if (!item || !allAnswered || overallScore === 0) {
            Alert.alert('Incomplete', 'Please answer all criteria and select an overall score.');
            return;
        }
        if (!session?.user?.id) {
            Alert.alert('Error', 'You must be signed in.');
            return;
        }

        setSubmitting(true);
        const { error } = await supabase
            .from('safety_scores')
            .insert({
                user_id: session.user.id,
                submission_id: item.id,
                scores: scores,
                overall_score: overallScore,
                notes: notes.trim() || null,
            });

        if (!error) {
            // Mark item as reviewed in the queue
            await supabase
                .from('safety_review_queue')
                .update({ status: 'reviewed' })
                .eq('id', item.id);

            Alert.alert(
                'Review Submitted!',
                'You earned $0.50 for this safety review.',
                [{ text: 'Next Review', onPress: fetchItem }, { text: 'Done', onPress: () => onNavigate(ScreenName.XUM_JUDGE) }]
            );
        } else {
            Alert.alert('Error', error.message);
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Loading review item...</Text>
            </View>
        );
    }

    if (!item) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 24 : 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <TouchableOpacity onPress={() => onNavigate(ScreenName.XUM_JUDGE)}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: theme.text, letterSpacing: 1 }}>SAFETY SCORING</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <MaterialIcons name="check-circle" size={64} color="#10b981" />
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 20, textAlign: 'center' }}>All Caught Up!</Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 8, textAlign: 'center' }}>No pending safety reviews at the moment.</Text>
                    <TouchableOpacity
                        onPress={() => onNavigate(ScreenName.XUM_JUDGE)}
                        style={{ marginTop: 24, backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Back to XUM Judge</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 24 : 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.XUM_JUDGE)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: theme.text, letterSpacing: 1 }}>SAFETY SCORING</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#10b98120' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981' }}>$0.50</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Prompt */}
                <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Original Prompt</Text>
                    <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22 }}>{item.prompt || 'No prompt available.'}</Text>
                </View>

                {/* AI Response */}
                <View style={{ backgroundColor: 'rgba(99,91,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(99,91,255,0.2)' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#635bff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>AI Response</Text>
                    <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22 }}>{item.ai_response || 'No response content.'}</Text>
                </View>

                {/* Safety Criteria */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Safety Criteria</Text>

                {CRITERIA.map((criterion) => {
                    const answer = scores[criterion.key];
                    return (
                        <View key={criterion.key} style={{ backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${criterion.color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                    <MaterialIcons name={criterion.icon as any} size={16} color={criterion.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{criterion.label}</Text>
                                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>{criterion.description}</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {(['yes', 'no', 'unsure'] as SafetyAnswer[]).map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => setAnswer(criterion.key, opt)}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 8,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            borderWidth: 1.5,
                                            borderColor: answer === opt
                                                ? (opt === 'yes' ? '#ef4444' : opt === 'no' ? '#10b981' : '#f59e0b')
                                                : theme.border,
                                            backgroundColor: answer === opt
                                                ? (opt === 'yes' ? '#ef444415' : opt === 'no' ? '#10b98115' : '#f59e0b15')
                                                : 'transparent',
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '700',
                                            textTransform: 'capitalize',
                                            color: answer === opt
                                                ? (opt === 'yes' ? '#ef4444' : opt === 'no' ? '#10b981' : '#f59e0b')
                                                : theme.textSecondary,
                                        }}>
                                            {opt}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })}

                {/* Overall Score */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 12 }}>Overall Safety Score</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setOverallScore(star)}
                            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: overallScore >= star ? '#f59e0b' : theme.border, backgroundColor: overallScore >= star ? '#f59e0b15' : 'transparent' }}
                        >
                            <MaterialIcons name="star" size={24} color={overallScore >= star ? '#f59e0b' : theme.border} />
                            <Text style={{ fontSize: 10, color: overallScore >= star ? '#f59e0b' : theme.textSecondary, marginTop: 2 }}>{star}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginBottom: 20 }}>
                    1 = Very Unsafe · 5 = Fully Safe
                </Text>

                {/* Notes */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Notes (Optional)</Text>
                <TextInput
                    style={{ backgroundColor: theme.surface, borderRadius: 12, padding: 14, fontSize: 14, color: theme.text, borderWidth: 1, borderColor: theme.border, minHeight: 80, textAlignVertical: 'top', marginBottom: 24 }}
                    placeholder="Add any additional notes or context..."
                    placeholderTextColor={theme.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                />

                {/* Submit */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting || !allAnswered || overallScore === 0}
                    style={{
                        backgroundColor: allAnswered && overallScore > 0 ? theme.primary : theme.border,
                        borderRadius: 14,
                        paddingVertical: 16,
                        alignItems: 'center',
                        opacity: submitting ? 0.7 : 1,
                    }}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Submit Review · Earn $0.50</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};
