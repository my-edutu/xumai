import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StyleSheet
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { TaskService } from '../services/taskService';
import { TaskSubmission } from '../services/types';
import { ScreenName } from '../types';
import { createGlobalStyles, createCaptureStyles } from '../styles';

interface RecordsScreenProps {
    onNavigate: (s: ScreenName) => void;
    session: any;
}

export const RecordsScreen: React.FC<RecordsScreenProps> = ({ onNavigate, session }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);
    const captureStyles = createCaptureStyles(theme);
    const [activeFilter, setActiveFilter] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');
    const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!session?.user?.id) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [subs, userStats] = await Promise.all([
                    TaskService.getUserSubmissions(session.user.id, { limit: 50 }),
                    TaskService.getUserTaskStats(session.user.id)
                ]);
                setSubmissions(subs);
                setStats(userStats);
            } catch (error) {
                console.error('Error loading records:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [session?.user?.id]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'voice':
            case 'voice_recording': return 'mic';
            case 'image':
            case 'image_capture': return 'photo-camera';
            case 'video':
            case 'video_recording': return 'videocam';
            case 'translation': return 'translate';
            case 'judge_review': return 'rate-review';
            case 'task_approved': return 'check-circle';
            case 'task_rejected': return 'cancel';
            default: return 'history';
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'voice':
            case 'voice_recording': return '#8b5cf6';
            case 'image':
            case 'image_capture': return '#3b82f6';
            case 'video':
            case 'video_recording': return '#ec4899';
            case 'translation': return '#14b8a6';
            case 'judge_review': return '#f59e0b';
            case 'task_approved': return '#10b981';
            case 'task_rejected': return '#ef4444';
            default: return theme.primary;
        }
    };

    const filters = [
        { label: 'Today', value: 'daily' as const },
        { label: 'Week', value: 'weekly' as const },
        { label: 'Month', value: 'monthly' as const },
        { label: 'All', value: 'all' as const },
    ];

    if (isLoading && !submissions.length) {
        return (
            <View style={[styles.screenContainer, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>MY RECORDS</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Filter Tabs */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter.value}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: activeFilter === filter.value ? theme.primary : theme.surface,
                            borderWidth: 1,
                            borderColor: activeFilter === filter.value ? theme.primary : theme.border,
                            alignItems: 'center',
                        }}
                        onPress={() => setActiveFilter(filter.value)}
                    >
                        <Text style={{ color: activeFilter === filter.value ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Summary Stats */}
                <View style={[captureStyles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 24 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ color: theme.primary, fontSize: 24, fontWeight: '700' }}>{stats?.totalSubmissions || 0}</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Activities</Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.success, fontSize: 24, fontWeight: '700' }}>
                                ${stats?.totalEarned?.toFixed(2) || '0.00'}
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Earned</Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ color: theme.primary, fontSize: 24, fontWeight: '700' }}>
                                {stats?.totalSubmissions > 0 ? Math.round((stats?.approved / stats?.totalSubmissions) * 100) : 100}%
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Accuracy</Text>
                        </View>
                    </View>
                </View>

                {/* Activity List */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>RECENT ACTIVITY</Text>

                {submissions.length > 0 ? (
                    submissions.map((record) => (
                        <View key={record.id} style={[captureStyles.optionCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 12 }]}>
                            <View style={[captureStyles.optionIconBox, { backgroundColor: `${getActivityColor(record.task_type)}15` }]}>
                                <MaterialIcons name={getActivityIcon(record.task_type) as any} size={24} color={getActivityColor(record.task_type)} />
                            </View>
                            <View style={captureStyles.optionInfo}>
                                <Text style={[captureStyles.optionTitle, { color: theme.text }]}>
                                    {record.task_type.charAt(0).toUpperCase() + record.task_type.slice(1)} Task
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                                    {record.status.toUpperCase()} • {new Date((record as any).created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: theme.success, fontSize: 14, fontWeight: '700' }}>+${record.total_reward.toFixed(2)}</Text>
                                <Text style={{ fontSize: 10, color: record.status === 'approved' ? theme.success : record.status === 'rejected' ? theme.error : theme.warning }}>
                                    {record.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <MaterialIcons name="history" size={48} color={theme.border} />
                        <Text style={{ color: theme.textSecondary, marginTop: 16 }}>No activities found</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};
