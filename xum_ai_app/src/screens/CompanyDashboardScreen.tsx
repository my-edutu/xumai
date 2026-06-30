/**
 * Company Dashboard Screen — Full Supabase Integration
 *
 * Overview : live stats from company_get_dashboard_stats
 * Tasks    : list + create via company_create_task RPC
 * Settings : profile, switch to user, logout
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Platform,
    TouchableWithoutFeedback,
    Share,
} from 'react-native';
import { CampaignWizard } from '../components/CampaignWizard';
import { getCompanyCampaigns, updateCampaignStatus } from '../services/campaignService';
import { CompanyCampaign } from '../services/types';
import * as FileSystem from 'expo-file-system/legacy';
import {
    TaskService,
} from '../services/taskService';
import { ApiKeyService, ApiKey } from '../services/apiKeyService';
import {
    getCompanyDataset,
    getCompanyNotifications,
    markNotificationsRead,
} from '../services/companyService';
import { Transaction, CompanyNotification } from '../services/types';
import { getUserBalance, getTransactionHistory } from '../services/walletService';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenName } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '@clerk/clerk-expo';
import { clearAccountType } from './AccountTypeScreen';
import { supabase } from '../supabaseClient';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_ITEMS = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' as const },
    { id: 'tasks', label: 'Tasks', icon: 'assignment' as const },
    { id: 'marketplace', label: 'Marketplace', icon: 'store' as const },
    { id: 'settings', label: 'Settings', icon: 'settings' as const },
] as const;

type TabId = typeof TAB_ITEMS[number]['id'];

const TASK_TYPES = [
    { value: 'audio', label: 'Voice / Audio', icon: 'mic' },
    { value: 'image', label: 'Image Capture', icon: 'camera-alt' },
    { value: 'video', label: 'Video Capture', icon: 'videocam' },
    { value: 'text', label: 'Text Input', icon: 'edit' },
    { value: 'validation', label: 'Validation / QA', icon: 'verified' },
    { value: 'linguasense', label: 'LinguaSense', icon: 'translate' },
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending_review: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
    active: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
    completed: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
    paused: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' },
    archived: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
};

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
    title: string;
    value: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    gradientColors: [string, string];
    onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradientColors, onPress }) => {
    const Content = (
        <LinearGradient colors={gradientColors} style={statStyles.card}>
            <View style={statStyles.iconContainer}>
                <MaterialIcons name={icon} size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={statStyles.title}>{title}</Text>
            <Text style={statStyles.value}>{value}</Text>
        </LinearGradient>
    );

    if (onPress) {
        return (
            <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.9}>
                {Content}
            </TouchableOpacity>
        );
    }
    return <View style={{ flex: 1 }}>{Content}</View>;
};

const statStyles = StyleSheet.create({
    card: { flex: 1, borderRadius: 20, padding: 18, minHeight: 120 },
    iconContainer: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    title: {
        fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4,
    },
    value: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1 },
});

// Shared modal style tokens used by TaskInsightsModal
const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    container: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
});

// ============================================================================
// TASK INSIGHTS MODAL
// ============================================================================

interface TaskInsightsModalProps {
    visible: boolean;
    onClose: () => void;
    task: any;
    campaign?: CompanyCampaign;
    theme: any;
}

const TaskInsightsModal: React.FC<TaskInsightsModalProps> = ({ visible, onClose, task, campaign, theme }) => {
    const [stats, setStats] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const taskId = task?.id || campaign?.id;
    const isCampaign = !!campaign;

    const loadInsights = useCallback(async () => {
        if (!taskId) return;
        setLoading(true);
        try {
            // Fetch basic stats (unique users, etc.)
            const { data: subStats, error: statsError } = await supabase
                .from('submissions')
                .select('user_id', { count: 'exact', head: false })
                .eq(isCampaign ? 'campaign_id' : 'task_id', taskId);

            if (statsError) throw statsError;

            const uniqueUsers = new Set(subStats?.map(s => s.user_id)).size;

            // Fetch recent activity
            const { data: recentSubs, error: subsError } = await supabase
                .from('submissions')
                .select('id, user_id, status, submitted_at')
                .eq(isCampaign ? 'campaign_id' : 'task_id', taskId)
                .order('submitted_at', { ascending: false })
                .limit(10);

            if (subsError) throw subsError;

            setStats({
                uniqueUsers,
                totalItems: subStats?.length || 0,
                approvedItems: subStats?.filter(s => s.status === 'approved').length || 0,
            });
            setSubmissions(recentSubs || []);
        } catch (err: any) {
            console.error('[TaskInsights] Error:', err.message);
        } finally {
            setLoading(false);
        }
    }, [taskId, isCampaign]);

    useEffect(() => {
        if (visible) {
            loadInsights();

            // Realtime subscription for items
            const channel = supabase
                .channel(`task-insights-${taskId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'submissions',
                        filter: isCampaign ? `campaign_id=eq.${taskId}` : `task_id=eq.${taskId}`,
                    },
                    (payload) => {
                        setSubmissions(prev => [payload.new, ...prev].slice(0, 10));
                        loadInsights(); // Refresh aggregate stats
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [visible, taskId, isCampaign, loadInsights]);

    if (!task && !campaign) return null;

    const title = task?.title || campaign?.title;
    const target = task?.target_submissions || campaign?.target_count || 0;
    const completed = task?.current_submissions || campaign?.completed_count || 0;
    const progress = target > 0 ? Math.round((completed / target) * 100) : 0;
    const unitPrice = task?.reward_per_submission || (campaign?.total_cost && campaign?.target_count ? campaign.total_cost / campaign.target_count : 0);
    const totalSpent = completed * unitPrice;
    const totalBudget = (task?.total_budget) || campaign?.total_cost || 0;
    const remaining = Math.max(0, totalBudget - totalSpent);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <View style={[modalStyles.container, { backgroundColor: theme.surface, height: '80%' }]}>
                    <View style={modalStyles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={[modalStyles.headerTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Real-time Task Insights</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
                            <MaterialIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Financial Snapshot */}
                        <View style={styles.statsRow}>
                            <View style={[styles.taskCard, { flex: 1, padding: 12, backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}20` }]}>
                                <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '800' }}>SPENT</Text>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text }}>${totalSpent.toFixed(2)}</Text>
                            </View>
                            <View style={{ width: 12 }} />
                            <View style={[styles.taskCard, { flex: 1, padding: 12, backgroundColor: `${theme.success}10`, borderColor: `${theme.success}20` }]}>
                                <Text style={{ fontSize: 10, color: theme.success, fontWeight: '800' }}>REMAINING</Text>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text }}>${remaining.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Progress Section */}
                        <View style={{ marginTop: 20, padding: 16, backgroundColor: `${theme.text}05`, borderRadius: 16 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: theme.text, fontWeight: '700' }}>Overall Progress</Text>
                                <Text style={{ color: theme.primary, fontWeight: '800' }}>{progress}%</Text>
                            </View>
                            <View style={[styles.progressBar, { backgroundColor: `${theme.text}10`, height: 8 }]}>
                                <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, height: 8 }]} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{completed} / {target} items</Text>
                                {loading && <ActivityIndicator size="small" color={theme.primary} />}
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View style={[styles.statsRow, { marginTop: 16 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[modalStyles.label, { color: theme.textSecondary }]}>Unique Contributors</Text>
                                <Text style={{ fontSize: 24, fontWeight: '900', color: theme.text }}>{stats?.uniqueUsers || 0}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[modalStyles.label, { color: theme.textSecondary }]}>Approved Items</Text>
                                <Text style={{ fontSize: 24, fontWeight: '900', color: theme.success }}>{stats?.approvedItems || 0}</Text>
                            </View>
                        </View>

                        {/* Activity Feed */}
                        <Text style={[modalStyles.label, { color: theme.textSecondary, marginTop: 24 }]}>Recent Activity</Text>
                        {submissions.length === 0 ? (
                            <Text style={{ color: theme.textSecondary, fontStyle: 'italic', marginTop: 8 }}>No activity yet...</Text>
                        ) : (
                            submissions.map((sub, idx) => (
                                <View key={sub.id + idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                                        <MaterialIcons name="person" size={20} color={theme.primary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: theme.text, fontWeight: '600' }}>User {sub.user_id.slice(0, 8)}...</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{sub.status === 'approved' ? 'Successfully uploaded' : 'Submitted for review'}</Text>
                                    </View>
                                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                            ))
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CompanyDashboardScreenProps {
    onNavigate: (screen: ScreenName, params?: any) => void;
    onLogout: () => void;
}

export const CompanyDashboardScreen: React.FC<CompanyDashboardScreenProps> = ({ onNavigate, onLogout }) => {
    const { theme } = useTheme();
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    // Data state
    const [stats, setStats] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<CompanyCampaign[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [setupDone, setSetupDone] = useState(false);
    const [isFabOpen, setIsFabOpen] = useState(false);

    // Insights state
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<CompanyCampaign | undefined>(undefined);
    const [editingCampaignData, setEditingCampaignData] = useState<CompanyCampaign | undefined>();
    const [showInsights, setShowInsights] = useState(false);

    // Notifications state
    const [notifications, setNotifications] = useState<CompanyNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // Dataset export state
    const [exportingTaskId, setExportingTaskId] = useState<string | null>(null);

    // API Keys state
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [newSecret, setNewSecret] = useState<string | null>(null);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);

    const userId = user?.id || '';
    const companyName = user?.fullName || user?.firstName || 'My Company';
    const initials = companyName.charAt(0).toUpperCase();

    // ─── Setup on mount ──────────────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;
        const setup = async () => {
            try {
                await supabase.rpc('ensure_company_setup', { p_user_id: userId });
                setSetupDone(true);
            } catch (err) {
                console.error('[CompanyDashboard] setup error:', err);
                setSetupDone(true); // proceed anyway
            }
        };
        setup();
    }, [userId]);

    // ─── Load data ───────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!userId) return;
        try {
            const [statsRes, tasksRes, txRes, realBalance, campaignsData, keysRes] = await Promise.all([
                supabase.rpc('company_get_dashboard_stats', { p_user_id: userId }),
                supabase.rpc('company_get_tasks', { p_user_id: userId }),
                getTransactionHistory(userId, 5),
                getUserBalance(userId),
                getCompanyCampaigns(userId),
                ApiKeyService.getApiKeys(),
            ]);

            if (statsRes.data) setStats(statsRes.data);
            if (tasksRes.data) setTasks(tasksRes.data);
            setTransactions(txRes || []);
            setBalance(realBalance);
            setCampaigns(campaignsData);
            if (!keysRes.error) setApiKeys(keysRes.keys);
        } catch (err) {
            console.error('[CompanyDashboard] load error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        if (setupDone) loadData();
    }, [setupDone, loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // ─── Load notifications ───────────────────────────────────────────────
    const loadNotifications = useCallback(async () => {
        if (!userId) return;
        const data = await getCompanyNotifications(userId);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
    }, [userId]);

    useEffect(() => {
        if (setupDone) loadNotifications();
    }, [setupDone, loadNotifications]);

    // ─── Realtime subscription ────────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`company-notifs-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'company_notifications',
                    filter: `company_id=eq.${userId}`,
                },
                (payload: any) => {
                    const notif = payload.new as CompanyNotification;
                    setNotifications(prev => [notif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    if (notif.type === 'task_completed') {
                        Alert.alert('🎉 Task Complete!', notif.message);
                        loadData(); // refresh task progress bars
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId]);

    // ─── Dataset export ───────────────────────────────────────────────────
    const handleExportDataset = async (task: any) => {
        setExportingTaskId(task.id);
        try {
            const result = await getCompanyDataset(task.id, task.title);
            if (!result.success || !result.manifest) {
                Alert.alert('Export Failed', result.error || 'Could not fetch dataset');
                return;
            }

            const manifest = result.manifest;
            const jsonString = JSON.stringify(manifest, null, 2);
            const safeName = task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `xum_dataset_${safeName}_${Date.now()}.json`;

            if (Platform.OS === 'web') {
                // Web: trigger browser file download
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = fileName;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(url);
                Alert.alert(
                    'Exported!',
                    `${manifest.total_approved} items downloaded as ${fileName}`
                );
            } else {
                // Native: write to cache dir then share
                const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
                await FileSystem.writeAsStringAsync(fileUri, jsonString, {
                    encoding: FileSystem.EncodingType.UTF8,
                });
                await Share.share({
                    title: `Dataset: ${task.title}`,
                    url: fileUri,   // picked up by iOS share sheet
                    message: `XUM AI Dataset — ${task.title}\n${manifest.total_approved} approved items\nExported: ${manifest.exported_at}`,
                });
            }
        } catch (err: any) {
            Alert.alert('Export Error', err.message || 'Something went wrong');
        } finally {
            setExportingTaskId(null);
        }
    };

    // ─── Open notifications panel ─────────────────────────────────────────
    const openNotifications = async () => {
        setShowNotifications(true);
        if (unreadCount > 0) {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            await markNotificationsRead(userId);
        }
    };

    const handleLogout = async () => {
        await clearAccountType();
        onLogout();
    };

    const handleStopCampaign = async (campaignId: string) => {
        const result = await updateCampaignStatus(campaignId, userId, 'paused');
        if (result.success) {
            loadData();
        } else {
            Alert.alert('Error', result.error || 'Failed to stop campaign');
        }
    };

    const handleResumeCampaign = async (campaignId: string) => {
        const result = await updateCampaignStatus(campaignId, userId, 'active');
        if (result.success) {
            loadData();
        } else {
            Alert.alert('Error', result.error || 'Failed to resume campaign');
        }
    };

    // ─── API Key Handlers ────────────────────────────────────────────────
    const handleGenerateApiKey = async () => {
        Alert.alert(
            'Generate API Key',
            'This will create a new live Enterprise API key. You will only be able to see the secret once.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate',
                    onPress: async () => {
                        setIsGeneratingKey(true);
                        const { key, rawSecret, error } = await ApiKeyService.generateApiKey(userId, companyName, 'live');
                        setIsGeneratingKey(false);
                        
                        if (error) {
                            Alert.alert('Error Generating Key', error);
                        } else if (key && rawSecret) {
                            setApiKeys(prev => [key, ...prev]);
                            setNewSecret(rawSecret);
                            setShowKeyModal(true);
                        }
                    }
                }
            ]
        );
    };

    const handleRevokeApiKey = (keyId: string) => {
        Alert.alert(
            'Revoke Key?',
            'This action is permanent and will break any integrations using this key immediately.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Revoke',
                    style: 'destructive',
                    onPress: async () => {
                        const { success, error } = await ApiKeyService.revokeApiKey(keyId);
                        if (success) {
                            setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'revoked' } : k));
                        } else {
                            Alert.alert('Error Revoking Key', error || 'Unknown error');
                        }
                    }
                }
            ]
        );
    };

    // ─── Overview Tab ────────────────────────────────────────────────────
    const renderOverview = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
            {/* Stat Cards */}
            <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                    <StatCard
                        title="Active Tasks"
                        value={String(stats?.active_tasks ?? 0)}
                        icon="assignment-turned-in"
                        gradientColors={['#3b82f6', '#2563eb']}
                        onPress={() => setActiveTab('tasks')}
                    />
                    <View style={{ width: 12 }} />
                    <StatCard
                        title="Total Submissions"
                        value={String(stats?.total_submissions ?? 0)}
                        icon="cloud-done"
                        gradientColors={['#8b5cf6', '#7c3aed']}
                        onPress={() => {
                            // Can navigate to a reports page if it existed, for now just stay or go to tasks
                            setActiveTab('tasks');
                        }}
                    />
                </View>
                <View style={styles.statsRow}>
                    <StatCard
                        title="Balance"
                        value={`$${Number(balance).toFixed(2)}`}
                        icon="account-balance-wallet"
                        gradientColors={['#f97316', '#ea580c']}
                        onPress={() => onNavigate(ScreenName.WALLET)}
                    />
                    <View style={{ width: 12 }} />
                    <StatCard
                        title="Marketplace"
                        value="Visit"
                        icon="store"
                        gradientColors={['#10b981', '#059669']}
                        onPress={() => setActiveTab('marketplace')}
                    />
                </View>
            </View>

            {/* Pipeline status */}
            {stats?.pending_tasks > 0 && (
                <View style={[styles.pipelineCard, { backgroundColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' }]}>
                    <MaterialIcons name="hourglass-top" size={20} color="#fbbf24" />
                    <Text style={{ color: '#fbbf24', fontWeight: '700', fontSize: 13, marginLeft: 8 }}>
                        {stats.pending_tasks} task{stats.pending_tasks > 1 ? 's' : ''} pending admin review
                    </Text>
                </View>
            )}

            {/* Recent History */}
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18, marginTop: 12, marginBottom: 16 }]}>Recent Activity</Text>
            {transactions.length > 0 ? (
                transactions.map((tx) => (
                    <View key={tx.id} style={[styles.historyItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.historyIcon, { backgroundColor: `${theme.primary}15` }]}>
                            <MaterialIcons
                                name={tx.type === 'earn' ? 'add' : tx.type === 'withdraw' ? 'arrow-outward' : 'check'}
                                size={18}
                                color={theme.primary}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.historyTitle, { color: theme.text }]}>{tx.description}</Text>
                            <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                        </View>
                        <Text style={[styles.historyAmount, { color: tx.type === 'earn' || tx.type === 'bonus' ? '#10b981' : theme.text }]}>
                            {tx.type === 'earn' || tx.type === 'bonus' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>No recent transactions.</Text>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    // ─── Tasks Tab ───────────────────────────────────────────────────────
    const renderTasks = () => {
        // Merge old tasks + new campaigns for display
        const now = new Date();
        return (
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <View style={styles.tasksHeader}>
                    <View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>My Campaigns</Text>
                        <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>Manage your data collection campaigns</Text>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
                ) : campaigns.length === 0 && tasks.length === 0 ? (
                    <View style={[styles.emptySection, { backgroundColor: theme.surface, borderColor: theme.border, paddingVertical: 60 }]}>
                        <MaterialIcons name="campaign" size={48} color={theme.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Campaigns Yet</Text>
                        <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                            Launch your first campaign to start collecting validated AI training data.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* New Campaigns */}
                        {campaigns.map((campaign) => {
                            const statusStyle = STATUS_COLORS[campaign.status] || STATUS_COLORS.active;
                            const progress = campaign.target_count > 0
                                ? Math.round((campaign.completed_count / campaign.target_count) * 100)
                                : 0;
                            const endsAt = campaign.ends_at ? new Date(campaign.ends_at) : null;
                            const daysLeft = endsAt
                                ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000))
                                : campaign.timeframe_days;
                            const tierColors: Record<string, string> = { basic: '#64748b', standard: '#3b82f6', premium: '#8b5cf6' };
                            const tierColor = tierColors[campaign.quality_tier] || '#64748b';

                            return (
                                <TouchableOpacity
                                    key={campaign.id}
                                    style={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={() => {
                                        setSelectedCampaign(campaign);
                                        setSelectedTask(null);
                                        setShowInsights(true);
                                    }}
                                >
                                    <View style={styles.taskRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>{campaign.title}</Text>
                                            <Text style={[styles.taskMeta, { color: theme.textSecondary }]}>
                                                {campaign.task_type?.toUpperCase()} · {campaign.target_count.toLocaleString()} items
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                {campaign.status === 'pending_review' ? 'Under Review' : campaign.status?.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Progress bar */}
                                    <View style={styles.progressSection}>
                                        <View style={[styles.progressBar, { backgroundColor: `${theme.text}10` }]}>
                                            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                                        </View>
                                        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                                            {campaign.completed_count}/{campaign.target_count} completed ({progress}%)
                                        </Text>
                                    </View>

                                    {/* Footer: quality tier, days left, regions */}
                                    <View style={[styles.taskFooter, { flexWrap: 'wrap', gap: 6 }]}>
                                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${tierColor}18`, borderWidth: 1, borderColor: `${tierColor}40` }}>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: tierColor, textTransform: 'uppercase' }}>
                                                {campaign.quality_tier}
                                            </Text>
                                        </View>
                                        {campaign.ends_at && (
                                            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' }}>
                                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#f59e0b' }}>
                                                    {daysLeft}d left
                                                </Text>
                                            </View>
                                        )}
                                        {(campaign.region_filter || []).slice(0, 2).map((r: string) => (
                                            <View key={r} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${theme.text}08`, borderWidth: 1, borderColor: theme.border }}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary }}>{r}</Text>
                                            </View>
                                        ))}
                                        {campaign.total_cost != null && (
                                            <Text style={[styles.taskBudget, { color: theme.textSecondary, marginLeft: 'auto' }]}>
                                                ${Number(campaign.total_cost).toFixed(2)}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
                                        {campaign.status === 'draft' && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: theme.primary + '15' }]}
                                                onPress={() => {
                                                    setEditingCampaignData(campaign);
                                                    setShowCreateModal(true);
                                                }}
                                            >
                                                <MaterialIcons name="edit" size={14} color={theme.primary} />
                                                <Text style={[styles.actionBtnText, { color: theme.primary }]}>Edit Draft</Text>
                                            </TouchableOpacity>
                                        )}
                                        {campaign.status === 'active' && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#ef444415' }]}
                                                onPress={() => handleStopCampaign(campaign.id)}
                                            >
                                                <MaterialIcons name="pause" size={14} color="#ef4444" />
                                                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Stop</Text>
                                            </TouchableOpacity>
                                        )}
                                        {campaign.status === 'paused' && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#10b98115' }]}
                                                onPress={() => handleResumeCampaign(campaign.id)}
                                            >
                                                <MaterialIcons name="play-arrow" size={14} color="#10b981" />
                                                <Text style={[styles.actionBtnText, { color: '#10b981' }]}>Resume</Text>
                                            </TouchableOpacity>
                                        )}
                                        <View style={{ flex: 1 }} />
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                                            onPress={() => {
                                                setSelectedCampaign(campaign);
                                                setSelectedTask(null);
                                                setShowInsights(true);
                                            }}
                                        >
                                            <MaterialIcons name="bar-chart" size={14} color={theme.textSecondary} />
                                            <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>Insights</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Legacy Tasks */}
                        {tasks.map((task) => {
                            const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.active;
                            const progress = task.target_submissions > 0
                                ? Math.round((task.current_submissions / task.target_submissions) * 100)
                                : 0;

                            return (
                                <TouchableOpacity
                                    key={task.id}
                                    style={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={() => {
                                        setSelectedTask(task);
                                        setSelectedCampaign(undefined);
                                        setShowInsights(true);
                                    }}
                                >
                                    <View style={styles.taskRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>{task.title}</Text>
                                            <Text style={[styles.taskMeta, { color: theme.textSecondary }]}>
                                                {task.task_type?.toUpperCase()} · ${Number(task.reward_per_submission).toFixed(2)}/item
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                {task.status === 'pending_review' ? 'Under Review' : task.status?.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.progressSection}>
                                        <View style={[styles.progressBar, { backgroundColor: `${theme.text}10` }]}>
                                            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                                        </View>
                                        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                                            {task.current_submissions}/{task.target_submissions} items · {task.approved_count || 0} approved
                                        </Text>
                                    </View>

                                    <View style={styles.taskFooter}>
                                        <Text style={[styles.taskBudget, { color: theme.textSecondary }]}>
                                            Budget: ${Number(task.total_budget).toFixed(2)}
                                        </Text>
                                        {(task.approved_count || 0) > 0 && (
                                            <TouchableOpacity
                                                style={[styles.exportBtn, exportingTaskId === task.id && { opacity: 0.6 }]}
                                                onPress={() => handleExportDataset(task)}
                                                disabled={exportingTaskId === task.id}
                                                activeOpacity={0.8}
                                            >
                                                {exportingTaskId === task.id ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <>
                                                        <MaterialIcons name="download" size={13} color="#fff" />
                                                        <Text style={styles.exportBtnText}>Export {task.approved_count} items</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </>
                )}
            </ScrollView>
        );
    };

    // ─── Marketplace Tab ────────────────────────────────────────────────
    const renderMarketplace = () => (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 8 }]}>Data Marketplace</Text>
            <Text style={[styles.sectionDesc, { color: theme.textSecondary, marginBottom: 24 }]}>
                Browse high-quality datasets or commission new data collection.
            </Text>

            <View style={[styles.emptySection, { backgroundColor: theme.surface, borderColor: theme.border, paddingVertical: 80 }]}>
                <MaterialIcons name="store" size={64} color={theme.primary} style={{ opacity: 0.5 }} />
                <Text style={[styles.emptyTitle, { color: theme.text, fontSize: 20, marginTop: 16 }]}>Access Restricted</Text>
                <Text style={[styles.emptyDesc, { color: theme.textSecondary, maxWidth: 300 }]}>
                    The marketplace is currently under construction. Check back later for curated datasets and labeling services.
                </Text>
            </View>
        </ScrollView>
    );

    // ─── Settings Tab ────────────────────────────────────────────────────
    const renderSettings = () => (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 20 }]}>Settings</Text>

            <View style={[styles.settingsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.settingsAvatar, { backgroundColor: '#f97316' }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsName, { color: theme.text }]}>{companyName}</Text>
                    <Text style={[styles.settingsEmail, { color: theme.textSecondary }]}>
                        {user?.primaryEmailAddress?.emailAddress || ''}
                    </Text>
                </View>
            </View>

            {/* General Settings Section */}
            <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 8, marginTop: 12 }]}>General</Text>

            <TouchableOpacity
                style={[styles.settingsRow, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => onNavigate(ScreenName.EDIT_PROFILE)}
            >
                <View style={[styles.settingsIcon, { backgroundColor: `${theme.primary}15` }]}>
                    <MaterialIcons name="business" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsLabel, { color: theme.text }]}>Company Profile</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.settingsRow, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => onNavigate(ScreenName.PAYMENT_METHODS)}
            >
                <View style={[styles.settingsIcon, { backgroundColor: `${theme.primary}15` }]}>
                    <MaterialIcons name="credit-card" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsLabel, { color: theme.text }]}>Billing & Payments</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.settingsRow, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => Alert.alert('Team Management', 'This feature is currently under maintenance for enterprise accounts.')}
            >
                <View style={[styles.settingsIcon, { backgroundColor: `${theme.primary}15` }]}>
                    <MaterialIcons name="people-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsLabel, { color: theme.text }]}>Team Members</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* API Access Section */}
            <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 8, marginTop: 12 }]}>API Access</Text>
            
            <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '500' }}>Manage Enterprise API Keys</Text>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.primary, alignSelf: 'flex-start' }]}
                        onPress={handleGenerateApiKey}
                        disabled={isGeneratingKey}
                    >
                        {isGeneratingKey ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name="add" size={14} color="#fff" />
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Generate Key</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {apiKeys.length === 0 ? (
                    <Text style={{ color: theme.textSecondary, fontStyle: 'italic', fontSize: 13, marginBottom: 12 }}>
                        No generated API keys.
                    </Text>
                ) : (
                    apiKeys.map(key => (
                        <View key={key.id} style={[styles.apiKeyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>{key.client_name}</Text>
                                        <View style={[styles.envBadge, { backgroundColor: key.environment === 'live' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)' }]}>
                                            <Text style={[styles.envBadgeText, { color: key.environment === 'live' ? '#10b981' : '#f97316' }]}>{key.environment}</Text>
                                        </View>
                                        <View style={[styles.envBadge, { backgroundColor: key.status === 'active' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                                            <Text style={[styles.envBadgeText, { color: key.status === 'active' ? '#3b82f6' : '#ef4444' }]}>{key.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 4 }}>
                                        Key ID: {key.id}
                                    </Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                                        Created: {new Date(key.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                {key.status === 'active' && (
                                    <TouchableOpacity 
                                        style={{ padding: 6, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8 }}
                                        onPress={() => handleRevokeApiKey(key.id)}
                                    >
                                        <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Application Settings Section */}
            <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 8, marginTop: 12 }]}>Application</Text>

            <TouchableOpacity
                style={[styles.settingsRow, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => onNavigate(ScreenName.NOTIFICATIONS)}
            >
                <View style={[styles.settingsIcon, { backgroundColor: `${theme.primary}15` }]}>
                    <MaterialIcons name="notifications-none" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsLabel, { color: theme.text }]}>Notifications</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.settingsRow, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => onNavigate(ScreenName.SUPPORT)}
            >
                <View style={[styles.settingsIcon, { backgroundColor: `${theme.primary}15` }]}>
                    <MaterialIcons name="help-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsLabel, { color: theme.text }]}>Help & Support</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.settingsRow, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 12 }]}
                onPress={handleLogout}
            >
                <View style={[styles.settingsIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <MaterialIcons name="logout" size={20} color="#ef4444" />
                </View>
                <Text style={[styles.settingsLabel, { color: '#ef4444' }]}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const scrollViewRef = React.useRef<ScrollView>(null);

    const handleTabPress = (tabId: TabId) => {
        setActiveTab(tabId);
        const index = TAB_ITEMS.findIndex(t => t.id === tabId);
        scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    };

    const handleScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / SCREEN_WIDTH);
        const tabId = TAB_ITEMS[index]?.id;
        if (tabId && tabId !== activeTab) {
            setActiveTab(tabId);
        }
    };


    // ─── Render ──────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Top Header */}
            <View style={[styles.topHeader, { borderBottomColor: theme.border }]}>
                <View>
                    <Text style={[styles.headerLogo, { color: theme.text }]}>
                        XUM <Text style={{ color: '#f97316' }}>AI</Text>
                    </Text>
                    <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Business</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {/* Notification bell */}
                    <TouchableOpacity onPress={openNotifications} style={{ position: 'relative' }}>
                        <MaterialIcons name="notifications" size={26} color={theme.text} />
                        {unreadCount > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>
                                    {unreadCount > 9 ? '9+' : String(unreadCount)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {/* Avatar */}
                    <TouchableOpacity onPress={() => handleTabPress('settings')}>
                        <View style={styles.headerAvatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tab Content - SWIPEABLE */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                style={styles.tabContent}
            >
                <View style={{ width: SCREEN_WIDTH, flex: 1 }}>{renderOverview()}</View>
                <View style={{ width: SCREEN_WIDTH, flex: 1 }}>{renderTasks()}</View>
                <View style={{ width: SCREEN_WIDTH, flex: 1 }}>{renderMarketplace()}</View>
                <View style={{ width: SCREEN_WIDTH, flex: 1 }}>{renderSettings()}</View>
            </ScrollView>

            {/* Bottom Tab Bar */}
            <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                {TAB_ITEMS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity key={tab.id} style={styles.tabButton} onPress={() => handleTabPress(tab.id)} activeOpacity={0.7}>
                            <MaterialIcons name={tab.icon} size={24} color={isActive ? '#f97316' : theme.textSecondary} />
                            <Text style={[styles.tabLabel, { color: isActive ? '#f97316' : theme.textSecondary }, isActive && styles.tabLabelActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Notifications Modal */}
            <Modal
                visible={showNotifications}
                transparent
                animationType="slide"
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={notifStyles.overlay}>
                    <View style={[notifStyles.panel, { backgroundColor: theme.surface }]}>
                        <View style={notifStyles.panelHeader}>
                            <Text style={[notifStyles.panelTitle, { color: theme.text }]}>
                                Notifications
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowNotifications(false)}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {notifications.length === 0 ? (
                            <View style={notifStyles.empty}>
                                <MaterialIcons name="notifications-none" size={48} color={theme.textSecondary} />
                                <Text style={[notifStyles.emptyText, { color: theme.textSecondary }]}>
                                    No notifications yet
                                </Text>
                                <Text style={[notifStyles.emptySubText, { color: theme.textSecondary }]}>
                                    You'll be notified when tasks reach 50%, 75%, and 100% completion.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {notifications.map((n) => (
                                    <View
                                        key={n.id}
                                        style={[
                                            notifStyles.item,
                                            { borderColor: theme.border },
                                            !n.is_read && { backgroundColor: 'rgba(249,115,22,0.06)' },
                                        ]}
                                    >
                                        <View style={[
                                            notifStyles.iconWrap,
                                            {
                                                backgroundColor: n.type === 'task_completed'
                                                    ? 'rgba(16,185,129,0.15)'
                                                    : 'rgba(249,115,22,0.12)',
                                            },
                                        ]}>
                                            <MaterialIcons
                                                name={n.type === 'task_completed' ? 'check-circle' : 'trending-up'}
                                                size={20}
                                                color={n.type === 'task_completed' ? '#10b981' : '#f97316'}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[notifStyles.msg, { color: theme.text }]}>
                                                {n.message}
                                            </Text>
                                            <Text style={[notifStyles.time, { color: theme.textSecondary }]}>
                                                {new Date(n.created_at).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </Text>
                                        </View>
                                        {!n.is_read && <View style={notifStyles.dot} />}
                                    </View>
                                ))}
                                <View style={{ height: 32 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            <CampaignWizard
                visible={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingCampaignData(undefined);
                }}
                onCreated={loadData}
                userId={userId}
                theme={theme}
                editingCampaign={editingCampaignData}
            />

            <TaskInsightsModal
                visible={showInsights}
                onClose={() => setShowInsights(false)}
                task={selectedTask}
                campaign={selectedCampaign}
                theme={theme}
            />

            {/* API Key Reveal Modal */}
            <Modal
                visible={showKeyModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowKeyModal(false)}
            >
                <View style={notifStyles.overlay}>
                    <View style={[notifStyles.panel, { backgroundColor: theme.surface, paddingBottom: 40 }]}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <MaterialIcons name="vpn-key" size={28} color="#10b981" />
                            </View>
                            <Text style={[notifStyles.panelTitle, { color: theme.text, textAlign: 'center' }]}>
                                API Key Generated
                            </Text>
                            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 20 }}>
                                Please copy this secret and store it safely. For security reasons, <Text style={{ fontWeight: '800', color: theme.text }}>we cannot show it to you again.</Text>
                            </Text>
                        </View>
                        
                        <View style={{ backgroundColor: `${theme.text}08`, borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Secret Key</Text>
                            <Text style={{ color: theme.text, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '600' }} selectable>
                                {newSecret}
                            </Text>
                        </View>

                        <TouchableOpacity 
                            style={{ backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
                            onPress={() => setShowKeyModal(false)}
                        >
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>I have saved this key safely</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Floating Action Button & Menu - ONLY ON OVERVIEW */}
            {activeTab === 'overview' && isFabOpen && (
                <TouchableOpacity
                    style={styles.fabOverlay}
                    activeOpacity={1}
                    onPress={() => setIsFabOpen(false)}
                >
                    <View style={[styles.fabMenu, { bottom: 100 }]}>
                        <TouchableOpacity
                            style={[styles.fabMenuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => { setIsFabOpen(false); setShowCreateModal(true); }}
                        >
                            <Text style={[styles.fabMenuText, { color: theme.text }]}>New Campaign</Text>
                            <View style={[styles.fabMenuIcon, { backgroundColor: '#f97316' }]}>
                                <MaterialIcons name="campaign" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.fabMenuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => { setIsFabOpen(false); onNavigate(ScreenName.WALLET); }}
                        >
                            <Text style={[styles.fabMenuText, { color: theme.text }]}>Fund Account</Text>
                            <View style={[styles.fabMenuIcon, { backgroundColor: '#10b981' }]}>
                                <MaterialIcons name="account-balance-wallet" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.fabMenuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => {
                                setIsFabOpen(false);
                                handleTabPress('marketplace');
                            }}
                        >
                            <Text style={[styles.fabMenuText, { color: theme.text }]}>Visit Marketplace</Text>
                            <View style={[styles.fabMenuIcon, { backgroundColor: '#3b82f6' }]}>
                                <MaterialIcons name="store" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}

            {/* Main FAB - ONLY ON OVERVIEW & TASKS */}
            {(activeTab === 'overview' || activeTab === 'tasks') && (
                <TouchableOpacity
                    style={[styles.fabMain, { backgroundColor: isFabOpen ? theme.text : '#f97316' }]}
                    activeOpacity={1} // Prevent white flash
                    onPress={() => setIsFabOpen(!isFabOpen)}
                >
                    <MaterialIcons name={isFabOpen ? "close" : "add"} size={28} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    container: { flex: 1 },
    topHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 24 : 12, paddingBottom: 16, borderBottomWidth: 1,
    },
    headerLogo: { fontSize: 22, fontWeight: '700', letterSpacing: 3 },
    headerSub: { fontSize: 9, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 },
    headerAvatar: {
        width: 40, height: 40, borderRadius: 14, backgroundColor: '#f97316',
        alignItems: 'center', justifyContent: 'center',
    },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 24 },
    tabContent: { flex: 1 },
    welcomeBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 20,
    },
    welcomeLabel: { fontSize: 12, fontWeight: '600' },
    welcomeName: { fontSize: 20, fontWeight: '800', marginTop: 4 },
    avatarCircle: {
        width: 48, height: 48, borderRadius: 16, backgroundColor: '#f97316',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
    statsGrid: { gap: 12, marginBottom: 20 },
    statsRow: { flexDirection: 'row' },
    perfCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 20 },
    perfHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    perfTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    perfBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.1)',
    },
    perfBadgeText: { fontSize: 10, fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 },
    perfValue: { fontSize: 48, fontWeight: '900', letterSpacing: -2, marginBottom: 12 },
    perfBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
    perfBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#f97316' },
    pipelineCard: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
    },
    emptySection: {
        borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
    emptyDesc: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 6, lineHeight: 20 },
    tasksHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '800' },
    sectionDesc: { fontSize: 13, fontWeight: '500', marginTop: 4 },
    submitButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#f97316', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    },
    submitButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },

    // Task cards
    taskCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
    taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    taskTitle: { fontSize: 15, fontWeight: '700' },
    taskMeta: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    progressSection: { marginBottom: 8 },
    progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#10b981' },
    progressText: { fontSize: 11, fontWeight: '600' },
    taskFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    taskBudget: { fontSize: 12, fontWeight: '600' },

    // Settings
    settingsRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
    },
    settingsAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    settingsName: { fontSize: 16, fontWeight: '700' },
    settingsEmail: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    settingsIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    settingsLabel: { fontSize: 14, fontWeight: '700' },
    settingsHint: { fontSize: 11, fontWeight: '500', marginTop: 2 },

    // Bottom Tab Bar
    bottomBar: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 28, paddingTop: 10 },
    tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
    tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    tabLabelActive: { fontWeight: '800' },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    actionBtnText: { fontSize: 11, fontWeight: '700' },

    // Recent History
    historyItem: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderRadius: 16, borderWidth: 1, marginBottom: 10,
    },
    historyIcon: {
        width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    },
    historyTitle: { fontSize: 13, fontWeight: '700' },
    historyDate: { fontSize: 11, fontWeight: '500', marginTop: 2 },
    historyAmount: { fontSize: 14, fontWeight: '700' },

    // FAB
    fabMain: {
        position: 'absolute', bottom: 100, right: 20,
        width: 60, height: 60, borderRadius: 30,
        alignItems: 'center', justifyContent: 'center',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 6,
        zIndex: 999,
    },
    fabOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998,
    },
    fabMenu: {
        position: 'absolute', right: 24, alignItems: 'flex-end', gap: 12,
    },
    fabMenuItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 24, borderWidth: 1,
    },
    fabMenuText: { fontSize: 13, fontWeight: '700' },
    fabMenuIcon: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },

    // Notification badge on bell icon
    notifBadge: {
        position: 'absolute', top: -4, right: -4,
        minWidth: 16, height: 16, borderRadius: 8,
        backgroundColor: '#ef4444',
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 3,
    },
    notifBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },

    // Dataset export button on task cards
    exportBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 10,
    },
    exportBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

    label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },

    // API Key Styles
    apiKeyCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
    },
    envBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    envBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});

// ── Notification panel styles (defined outside main StyleSheet to keep them separate)
const notifStyles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
    },
    panel: {
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, maxHeight: '75%',
    },
    panelHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
    },
    panelTitle: { fontSize: 20, fontWeight: '800' },
    empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
    emptyText: { fontSize: 15, fontWeight: '700', marginTop: 12 },
    emptySubText: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 6, lineHeight: 20 },
    item: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        paddingVertical: 14, paddingHorizontal: 4,
        borderBottomWidth: 1,
    },
    iconWrap: {
        width: 38, height: 38, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    msg: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
    time: { fontSize: 11, fontWeight: '500', marginTop: 4 },
    dot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#f97316', marginTop: 4, flexShrink: 0,
    },
});
