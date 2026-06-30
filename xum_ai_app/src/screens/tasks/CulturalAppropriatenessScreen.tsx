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

interface CulturalAppropriatenessScreenProps {
    onNavigate: (s: ScreenName) => void;
    session: any;
}

type CulturalAnswer = 'yes' | 'no' | 'unsure';

interface CulturalCriteria {
    key: string;
    label: string;
    description: string;
    icon: string;
    color: string;
}

const CRITERIA: CulturalCriteria[] = [
    { key: 'culturally_accurate', label: 'Culturally Accurate', description: 'Content reflects authentic cultural knowledge', icon: 'verified', color: '#10b981' },
    { key: 'offensive_taboo', label: 'Offensive / Taboo', description: 'May be considered disrespectful or taboo in the region', icon: 'block', color: '#ef4444' },
    { key: 'dialect_appropriate', label: 'Dialect Appropriate', description: 'Language/dialect usage is natural for the region', icon: 'translate', color: '#7c3aed' },
    { key: 'represents_region', label: 'Represents Region Correctly', description: 'Accurately portrays the region, people, or context', icon: 'place', color: '#0891b2' },
];

export const CulturalAppropriatenessScreen: React.FC<CulturalAppropriatenessScreenProps> = ({ onNavigate, session }) => {
    const { theme } = useTheme();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [scores, setScores] = useState<Record<string, CulturalAnswer>>({});
    const [overallScore, setOverallScore] = useState<number>(0);
    const [reviewerRegion, setReviewerRegion] = useState('');

    useEffect(() => { fetchItem(); }, []);

    const fetchItem = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cultural_review_queue')
            .select('id, content, content_type, target_region, language, context, created_at')
            .eq('status', 'pending')
            .limit(10);

        if (!error && data && data.length > 0) {
            const picked = data[Math.floor(Math.random() * data.length)];
            setItem(picked);
            setReviewerRegion(picked.target_region || '');
        } else {
            setItem(null);
        }
        setScores({});
        setOverallScore(0);
        setLoading(false);
    };

    const setAnswer = (criterionKey: string, answer: CulturalAnswer) => {
        setScores(prev => ({ ...prev, [criterionKey]: answer }));
    };

    const allAnswered = CRITERIA.every(c => scores[c.key]);

    const handleSubmit = async () => {
        if (!item || !allAnswered || overallScore === 0) {
            Alert.alert('Incomplete', 'Please answer all criteria and provide an overall score.');
            return;
        }
        if (!session?.user?.id) {
            Alert.alert('Error', 'You must be signed in.');
            return;
        }

        setSubmitting(true);
        const { error } = await supabase
            .from('cultural_scores')
            .insert({
                user_id: session.user.id,
                content_id: item.id,
                region: reviewerRegion.trim() || item.target_region,
                scores: scores,
                overall_score: overallScore,
            });

        if (!error) {
            await supabase
                .from('cultural_review_queue')
                .update({ status: 'reviewed' })
                .eq('id', item.id);

            Alert.alert(
                'Review Submitted!',
                'You earned $0.75 for this cultural review.',
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
                    <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: theme.text, letterSpacing: 1 }}>CULTURAL REVIEW</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <MaterialIcons name="check-circle" size={64} color="#10b981" />
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 20, textAlign: 'center' }}>All Caught Up!</Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 8, textAlign: 'center' }}>No pending cultural reviews at the moment.</Text>
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
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: theme.text, letterSpacing: 1 }}>CULTURAL REVIEW</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#7c3aed20' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#7c3aed' }}>$0.75</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Content to Review */}
                <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
                            Content ({item.content_type || 'text'})
                        </Text>
                        {item.target_region && (
                            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#0891b215' }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#0891b2' }}>{item.target_region}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22 }}>{item.content || 'No content available.'}</Text>
                    {item.context && (
                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>Context</Text>
                            <Text style={{ fontSize: 12, color: theme.textSecondary }}>{item.context}</Text>
                        </View>
                    )}
                </View>

                {/* Reviewer's Region */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Your Region / Expertise</Text>
                <TextInput
                    style={{ backgroundColor: theme.surface, borderRadius: 12, padding: 14, fontSize: 14, color: theme.text, borderWidth: 1, borderColor: theme.border, marginBottom: 20 }}
                    placeholder="e.g. Nigeria, West Africa, Yoruba"
                    placeholderTextColor={theme.textSecondary}
                    value={reviewerRegion}
                    onChangeText={setReviewerRegion}
                />

                {/* Cultural Criteria */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Cultural Criteria</Text>

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
                                {(['yes', 'no', 'unsure'] as CulturalAnswer[]).map((opt) => (
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
                                                ? (opt === 'yes' ? '#10b981' : opt === 'no' ? '#ef4444' : '#f59e0b')
                                                : theme.border,
                                            backgroundColor: answer === opt
                                                ? (opt === 'yes' ? '#10b98115' : opt === 'no' ? '#ef444415' : '#f59e0b15')
                                                : 'transparent',
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '700',
                                            textTransform: 'capitalize',
                                            color: answer === opt
                                                ? (opt === 'yes' ? '#10b981' : opt === 'no' ? '#ef4444' : '#f59e0b')
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

                {/* Overall Appropriateness Score */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 12 }}>Overall Appropriateness</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setOverallScore(star)}
                            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: overallScore >= star ? '#7c3aed' : theme.border, backgroundColor: overallScore >= star ? '#7c3aed15' : 'transparent' }}
                        >
                            <MaterialIcons name="star" size={24} color={overallScore >= star ? '#7c3aed' : theme.border} />
                            <Text style={{ fontSize: 10, color: overallScore >= star ? '#7c3aed' : theme.textSecondary, marginTop: 2 }}>{star}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginBottom: 28 }}>
                    1 = Very Inappropriate · 5 = Fully Appropriate
                </Text>

                {/* Submit */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting || !allAnswered || overallScore === 0}
                    style={{
                        backgroundColor: allAnswered && overallScore > 0 ? '#7c3aed' : theme.border,
                        borderRadius: 14,
                        paddingVertical: 16,
                        alignItems: 'center',
                        opacity: submitting ? 0.7 : 1,
                    }}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Submit Review · Earn $0.75</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};
