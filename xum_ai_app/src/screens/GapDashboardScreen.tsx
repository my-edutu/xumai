import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { GapService, DataGap } from '../services/gapService';

interface GapDashboardScreenProps {
    onNavigate: (s: ScreenName, params?: any) => void; // Params needed to pass context to Prompt Genius
    onBack?: () => void;
}

const SEVERITY_COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#fbbf24',
    low: '#10b981'
};

export const GapDashboardScreen = ({ onNavigate, onBack }: GapDashboardScreenProps) => {
    const { theme } = useTheme();
    const [gaps, setGaps] = useState<DataGap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGaps();
    }, []);

    const loadGaps = async () => {
        setLoading(true);
        try {
            const data = await GapService.detectGaps();
            setGaps(data);
        } catch (err) {
            Alert.alert('Error', 'Failed to load gap analysis.');
        } finally {
            setLoading(false);
        }
    };

    const handleSolveGap = (gap: DataGap) => {
        // Navigate to Prompt Genius with pre-filled context
        // Note: We need to update PromptGeniusScreen to accept params, 
        // but for now we'll just navigate. In a real app, params would populate field.
        Alert.alert(
            'Solve this Gap?',
            `This will launch the Prompt Engine for "${gap.recommended_action.prompt_context}"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Launch Engine',
                    onPress: () => onNavigate(ScreenName.PROMPT_GENIUS, {
                        initialContext: gap.recommended_action.prompt_context,
                        initialType: gap.recommended_action.type
                    })
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.COMPANY_DASHBOARD)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>DATA GAP INTELLIGENCE</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.primary }]}>LIVE COVERAGE MAP</Text>
                </View>
                <TouchableOpacity onPress={loadGaps}>
                    <MaterialIcons name="refresh" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Visual Header */}
                <View style={[styles.mapVisual, { backgroundColor: theme.surface }]}>
                    <View
                        style={[StyleSheet.absoluteFill, { backgroundColor: `${theme.primary}05` }]}
                    />
                    <MaterialIcons name="public" size={64} color={theme.primary} style={{ opacity: 0.5 }} />
                    <Text style={[styles.mapText, { color: theme.textSecondary }]}>
                        Global Coverage Analysis
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: SEVERITY_COLORS.critical }]} />
                            <Text style={{ fontSize: 10, color: theme.textSecondary }}>CRITICAL GAP</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: SEVERITY_COLORS.low }]} />
                            <Text style={{ fontSize: 10, color: theme.textSecondary }}>GOOD COVERAGE</Text>
                        </View>
                    </View>
                </View>

                {/* Gap List */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>DETECTED GAPS ({gaps.length})</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                ) : (
                    gaps.map((gap) => (
                        <View key={gap.id} style={[styles.gapCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.severityBadge, { backgroundColor: `${SEVERITY_COLORS[gap.severity]}20` }]}>
                                    <Text style={[styles.severityText, { color: SEVERITY_COLORS[gap.severity] }]}>
                                        {gap.severity.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.regionText, { color: theme.textSecondary }]}>
                                    <MaterialIcons name="place" size={12} /> {gap.region}
                                </Text>
                            </View>

                            <Text style={[styles.gapTitle, { color: theme.text }]}>{gap.title}</Text>
                            <Text style={[styles.gapDesc, { color: theme.textSecondary }]}>{gap.description}</Text>

                            {/* Coverage Bar */}
                            <View style={{ marginTop: 12, marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>COVERAGE</Text>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: SEVERITY_COLORS[gap.severity] }}>{gap.coverage_percentage}%</Text>
                                </View>
                                <View style={{ height: 6, backgroundColor: theme.border, borderRadius: 3, overflow: 'hidden' }}>
                                    <View style={{ width: `${gap.coverage_percentage}%`, backgroundColor: SEVERITY_COLORS[gap.severity], height: '100%' }} />
                                </View>
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                                onPress={() => handleSolveGap(gap)}
                            >
                                <MaterialIcons name="auto-fix-high" size={16} color="#fff" />
                                <Text style={styles.actionBtnText}>SOLVE WITH AI</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 24 : 12, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1
    },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    headerSubtitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
    content: { padding: 20 },

    mapVisual: {
        height: 160, borderRadius: 20, marginBottom: 24,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(59,130,246,0.1)'
    },
    mapText: { fontSize: 12, fontWeight: '700', marginTop: 12, letterSpacing: 1 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },

    sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },

    gapCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    severityText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    regionText: { fontSize: 11, fontWeight: '600' },

    gapTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    gapDesc: { fontSize: 13, lineHeight: 18 },

    actionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 12, borderRadius: 12
    },
    actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1 }
});
