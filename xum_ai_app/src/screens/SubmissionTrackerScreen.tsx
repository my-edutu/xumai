/**
 * XUM AI — Submission Tracker Screen
 * Real-time pipeline status for user submissions: pending, approved, rejected.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { createGlobalStyles } from '../styles';
import { supabase } from '../supabaseClient';

interface SubmissionTrackerScreenProps {
    onNavigate: (s: ScreenName) => void;
    onBack?: () => void;
    session: any;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
    pending:   { color: '#f59e0b', icon: 'hourglass-empty', label: 'Pending' },
    approved:  { color: '#10b981', icon: 'check-circle',    label: 'Approved' },
    rejected:  { color: '#f43f5e', icon: 'cancel',          label: 'Rejected' },
    reviewing: { color: '#3b82f6', icon: 'rate-review',     label: 'In Review' },
};

const TASK_TYPE_ICONS: Record<string, string> = {
    voice:      'mic',
    image:      'photo-camera',
    video:      'videocam',
    text:       'text-fields',
    validation: 'verified',
    lexicon:    'translate',
    rlhf:       'balance',
};

export const SubmissionTrackerScreen: React.FC<SubmissionTrackerScreenProps> = ({ onNavigate, onBack, session }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);

    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

    useEffect(() => {
        if (session?.user?.id) loadSubmissions();
    }, [session?.user?.id]);

    const loadSubmissions = async (refreshing = false) => {
        if (!session?.user?.id || !supabase) {
            setIsLoading(false);
            return;
        }
        if (refreshing) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const { data } = await supabase
                .from('submissions')
                .select('id, status, submission_data, created_at, validator_count, consensus_score, pre_check_passed, pre_check_flags')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            // Normalise rows so downstream rendering works regardless of table shape
            const rows = (data || []).map((r: any) => ({
                ...r,
                task_type: r.submission_data?.task_type ?? r.task_type ?? 'unknown',
                reward: r.submission_data?.total_reward ?? r.reward,
                language: r.submission_data?.language ?? r.language,
                country: r.submission_data?.country ?? r.country,
                rejection_reason: r.rejection_reason ?? null,
            }));
            setSubmissions(rows);

            setStats({
                pending:  rows.filter((r: any) => r.status === 'pending' || r.status === 'reviewing').length,
                approved: rows.filter((r: any) => r.status === 'approved').length,
                rejected: rows.filter((r: any) => r.status === 'rejected').length,
                total:    rows.length,
            });
        } catch (e) {
            console.warn('Tracker load error:', e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const filtered = activeFilter === 'all'
        ? submissions
        : submissions.filter((s: any) => {
            if (activeFilter === 'pending') return s.status === 'pending' || s.status === 'reviewing';
            return s.status === activeFilter;
        });

    const FILTERS: { key: StatusFilter; label: string }[] = [
        { key: 'all',      label: `All (${stats.total})` },
        { key: 'pending',  label: `Pending (${stats.pending})` },
        { key: 'approved', label: `Approved (${stats.approved})` },
        { key: 'rejected', label: `Rejected (${stats.rejected})` },
    ];

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>MY SUBMISSIONS</Text>
                <TouchableOpacity onPress={() => loadSubmissions(true)}>
                    <MaterialIcons name="refresh" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={{ flexDirection: 'row', padding: 16, gap: 10 }}>
                {[
                    { label: 'TOTAL',    value: stats.total,    color: theme.primary },
                    { label: 'APPROVED', value: stats.approved, color: '#10b981' },
                    { label: 'PENDING',  value: stats.pending,  color: '#f59e0b' },
                    { label: 'REJECTED', value: stats.rejected, color: '#f43f5e' },
                ].map((stat) => (
                    <View
                        key={stat.label}
                        style={{
                            flex: 1,
                            backgroundColor: theme.surface,
                            borderRadius: 12,
                            padding: 12,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                    >
                        <Text style={{ color: stat.color, fontSize: 20, fontWeight: '900' }}>{stat.value}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 }}>
                            {stat.label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Accuracy Rate */}
            {stats.total > 0 && (
                <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                    <View style={{ backgroundColor: theme.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Accuracy Rate</Text>
                            <Text style={{ color: theme.success, fontWeight: '800' }}>
                                {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : '0'}%
                            </Text>
                        </View>
                        <View style={{ height: 6, backgroundColor: theme.border, borderRadius: 3 }}>
                            <View style={{
                                height: 6,
                                width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%`,
                                backgroundColor: theme.success,
                                borderRadius: 3,
                            }} />
                        </View>
                    </View>
                </View>
            )}

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
            >
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        onPress={() => setActiveFilter(f.key)}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            borderRadius: 20,
                            backgroundColor: activeFilter === f.key ? theme.primary : theme.surface,
                            borderWidth: 1,
                            borderColor: activeFilter === f.key ? theme.primary : theme.border,
                        }}
                    >
                        <Text style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: activeFilter === f.key ? '#fff' : theme.textSecondary,
                        }}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Submission List */}
            {isLoading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : (
                <ScrollView
                    style={styles.flex1}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => loadSubmissions(true)}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {filtered.length === 0 ? (
                        <View style={{ paddingTop: 60, alignItems: 'center' }}>
                            <MaterialIcons name="inbox" size={48} color={theme.textSecondary} style={{ marginBottom: 12 }} />
                            <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 15 }}>
                                {activeFilter === 'all'
                                    ? 'No submissions yet.\nComplete a task to see it here.'
                                    : `No ${activeFilter} submissions.`}
                            </Text>
                        </View>
                    ) : (
                        filtered.map((sub: any) => {
                            const statusInfo = STATUS_CONFIG[sub.status] || STATUS_CONFIG['pending'];
                            const taskIcon = TASK_TYPE_ICONS[sub.task_type] || 'assignment';

                            return (
                                <View
                                    key={sub.id}
                                    style={{
                                        backgroundColor: theme.surface,
                                        borderRadius: 14,
                                        padding: 16,
                                        marginBottom: 12,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        borderLeftWidth: 3,
                                        borderLeftColor: statusInfo.color,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{
                                            width: 40, height: 40, borderRadius: 20,
                                            backgroundColor: `${theme.primary}15`,
                                            justifyContent: 'center', alignItems: 'center',
                                            marginRight: 12,
                                        }}>
                                            <MaterialIcons name={taskIcon as any} size={22} color={theme.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' }}>
                                                {sub.task_type || 'Task'} Submission
                                            </Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                                {sub.created_at ? new Date(sub.created_at).toLocaleString() : 'Unknown date'}
                                            </Text>
                                        </View>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: `${statusInfo.color}15`,
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                            borderRadius: 20,
                                            gap: 4,
                                        }}>
                                            <MaterialIcons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
                                            <Text style={{ color: statusInfo.color, fontSize: 11, fontWeight: '700' }}>
                                                {statusInfo.label}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Metadata row */}
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                        {sub.language && (
                                            <View style={{ backgroundColor: `${theme.primary}10`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                                <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '600' }}>
                                                    🌐 {sub.language}
                                                </Text>
                                            </View>
                                        )}
                                        {sub.country && (
                                            <View style={{ backgroundColor: `${theme.primary}10`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                                <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '600' }}>
                                                    📍 {sub.country}
                                                </Text>
                                            </View>
                                        )}
                                        {sub.reward != null && (
                                            <View style={{ backgroundColor: `${theme.success}10`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                                <Text style={{ color: theme.success, fontSize: 11, fontWeight: '700' }}>
                                                    ${Number(sub.reward).toFixed(2)}
                                                </Text>
                                            </View>
                                        )}
                                        {sub.validator_count > 0 && (
                                            <View style={{ backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                                <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '600' }}>
                                                    👥 {sub.validator_count} validator{sub.validator_count !== 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        )}
                                        {sub.consensus_score != null && (
                                            <View style={{ backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                                <Text style={{ color: '#8b5cf6', fontSize: 11, fontWeight: '700' }}>
                                                    ✦ {sub.consensus_score}% quality
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Rejection reason */}
                                    {sub.status === 'rejected' && sub.rejection_reason && (
                                        <View style={{
                                            backgroundColor: 'rgba(244,63,94,0.06)',
                                            borderRadius: 10,
                                            padding: 10,
                                            marginTop: 10,
                                            borderWidth: 1,
                                            borderColor: 'rgba(244,63,94,0.15)',
                                        }}>
                                            <Text style={{ color: '#f43f5e', fontSize: 12, fontWeight: '600' }}>
                                                Rejection reason: {sub.rejection_reason}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
};
