import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenName } from '../types';
import { Header } from '../components/Shared';
import { supabase } from '../supabaseClient';
import * as DatasetService from '../services/datasetService';

interface AdminScreenProps {
    onNavigate: (screen: ScreenName) => void;
    session?: any;
}

/**
 * Admin Login Screen
 * Authenticates admin via Clerk session — verifies role in Supabase users table.
 */
export const AdminLoginScreen: React.FC<AdminScreenProps> = ({ onNavigate, session }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            // Verify admin role in Supabase users table using the Clerk-synced user
            if (!session?.user?.id) {
                Alert.alert('Error', 'You must be signed in first.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error || !data || data.role !== 'admin') {
                Alert.alert('Access Denied', 'Your account does not have admin privileges.');
                setLoading(false);
                return;
            }

            onNavigate(ScreenName.ADMIN_DASHBOARD);
        } catch (err) {
            Alert.alert('Error', 'Failed to verify admin access.');
        }
        setLoading(false);
    };

    return (
        <View className="flex-1 bg-white dark:bg-[#0a0d1d]">
            <View className="h-56 bg-primary dark:bg-primary/20 relative w-full pt-12">
                <View className="flex-1 justify-end p-8 pb-8">
                    <TouchableOpacity
                        onPress={() => onNavigate(ScreenName.AUTH)}
                        className="absolute top-0 left-6"
                    >
                        <MaterialIcons name="arrow-back" size={28} color="#ffffff66" />
                    </TouchableOpacity>
                    <Text className="text-white text-4xl font-bold tracking-tighter mb-2">
                        Admin<Text className="text-cyan-400">.</Text>
                    </Text>
                    <Text className="text-white/60 text-sm font-semibold uppercase tracking-[2px]">
                        Control Terminal
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-8" contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="gap-5 mt-4">
                    <View>
                        <Text className="text-white/40 text-[10px] font-semibold uppercase tracking-widest ml-1 mb-2">
                            Admin Email
                        </Text>
                        <View className="relative justify-center">
                            <MaterialIcons
                                name="alternate-email"
                                size={20}
                                color="#ffffff33"
                                style={{ position: 'absolute', left: 16, zIndex: 10 }}
                            />
                            <TextInput
                                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white font-medium"
                                placeholder="admin@xum.ai"
                                placeholderTextColor="#ffffff33"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-white/40 text-[10px] font-semibold uppercase tracking-widest ml-1 mb-2">
                            Access Key
                        </Text>
                        <View className="relative justify-center">
                            <MaterialIcons
                                name="lock-open"
                                size={20}
                                color="#ffffff33"
                                style={{ position: 'absolute', left: 16, zIndex: 10 }}
                            />
                            <TextInput
                                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12 pr-12 text-white font-medium"
                                placeholder="••••••••"
                                placeholderTextColor="#ffffff33"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 16 }}
                            >
                                <MaterialIcons
                                    name={showPassword ? 'visibility-off' : 'visibility'}
                                    size={20}
                                    color="#ffffff4d"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="w-full h-14 bg-white rounded-2xl items-center justify-center mt-4"
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text className="text-black font-bold uppercase tracking-widest">
                            {loading ? 'Authenticating...' : 'Access Terminal'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

/**
 * Admin Dashboard Screen
 * Main control hub for administrative operations.
 */
export const AdminDashboardScreen: React.FC<AdminScreenProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState({ pendingSubmissions: 0, pendingWithdrawals: 0, pendingCampaigns: 0, totalPending: 0 });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const [{ count: subCount }, { count: wdCount }, { count: campCount }] = await Promise.all([
            supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('withdrawals').select('id', { count: 'exact', head: true }).in('status', ['pending', 'admin_review']),
            supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
        ]);
        setStats({
            pendingSubmissions: subCount || 0,
            pendingWithdrawals: wdCount || 0,
            pendingCampaigns: campCount || 0,
            totalPending: (subCount || 0) + (wdCount || 0) + (campCount || 0),
        });
    };

    const adminModules = [
        {
            title: 'User Management',
            subtitle: 'Manage contributor accounts',
            icon: 'people',
            color: '#3b82f6',
            screen: ScreenName.ADMIN_USER_MANAGEMENT,
        },
        {
            title: 'Task Moderation',
            subtitle: `${stats.pendingSubmissions} pending review`,
            icon: 'fact-check',
            color: '#10b981',
            screen: ScreenName.ADMIN_TASK_MODERATION,
        },
        {
            title: 'Payouts',
            subtitle: `${stats.pendingWithdrawals} pending requests`,
            icon: 'payments',
            color: '#f59e0b',
            screen: ScreenName.ADMIN_PAYOUTS,
        },
        {
            title: 'Campaign Requests',
            subtitle: `${stats.pendingCampaigns} pending campaigns`,
            icon: 'campaign',
            color: '#f97316',
            screen: ScreenName.ADMIN_CAMPAIGNS,
        },
        {
            title: 'Data Gap Intelligence',
            subtitle: 'Visualize missing data regions',
            icon: 'radar',
            color: '#7c3aed',
            screen: ScreenName.GAP_DASHBOARD,
        },
        {
            title: 'Prompt Genius',
            subtitle: 'AI Task Generation Engine',
            icon: 'auto-awesome',
            color: '#3b82f6',
            screen: ScreenName.PROMPT_GENIUS,
        },
        {
            title: 'Audit Logs',
            subtitle: 'Admin action history',
            icon: 'history',
            color: '#06b6d4',
            screen: ScreenName.ADMIN_AUDIT_LOGS,
        },
        {
            title: 'Fraud Detection',
            subtitle: 'Flagged & suspicious users',
            icon: 'gpp-bad',
            color: '#ef4444',
            screen: ScreenName.ADMIN_FRAUD_DETECTION,
        },
        {
            title: 'Active Sessions',
            subtitle: 'Currently online users',
            icon: 'sensors',
            color: '#10b981',
            screen: ScreenName.ADMIN_SESSIONS,
        },
        {
            title: 'Lexicon Orchestrator',
            subtitle: 'Language campaign coverage',
            icon: 'language',
            color: '#f59e0b',
            screen: ScreenName.ADMIN_LEXICON,
        },
        {
            title: 'Marketplace Management',
            subtitle: 'Publish datasets to store',
            icon: 'storefront',
            color: '#10b981',
            screen: ScreenName.ADMIN_MARKETPLACE_MANAGEMENT,
        },
    ];

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Admin Terminal" onBack={() => onNavigate(ScreenName.HOME)} />

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Stats Overview */}
                <View className="mt-6">
                    <View className="rounded-3xl p-8 bg-primary dark:bg-surface-dark border border-white/10 relative overflow-hidden">
                        <View className="absolute top-0 right-0 opacity-10">
                            <MaterialIcons name="admin-panel-settings" size={120} color="white" />
                        </View>
                        <View className="relative z-10">
                            <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">
                                Pending Actions
                            </Text>
                            <Text className="text-3xl font-bold text-white tracking-tighter">
                                {stats.totalPending} items need review
                            </Text>
                            <View className="flex-row items-center gap-2 mt-3">
                                <MaterialIcons name={stats.totalPending === 0 ? 'check-circle' : 'pending'} size={16} color={stats.totalPending === 0 ? '#34d399' : '#fbbf24'} />
                                <Text className={stats.totalPending === 0 ? 'text-emerald-400 text-xs font-bold uppercase tracking-widest' : 'text-amber-400 text-xs font-bold uppercase tracking-widest'}>
                                    {stats.totalPending === 0 ? 'All Clear' : 'Needs Attention'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Admin Modules */}
                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-8 mb-4 px-2">
                    Control Modules
                </Text>
                <View className="gap-4">
                    {adminModules.map((module, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onNavigate(module.screen)}
                            className="flex-row items-center p-5 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800"
                        >
                            <View
                                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                                style={{ backgroundColor: `${module.color}20` }}
                            >
                                <MaterialIcons name={module.icon as any} size={24} color={module.color} />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                                    {module.title}
                                </Text>
                                <Text className="text-xs text-slate-500 mt-1">{module.subtitle}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    onPress={() => onNavigate(ScreenName.AUTH)}
                    className="flex-row items-center justify-center h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mt-8"
                >
                    <MaterialIcons name="logout" size={20} color="#ef4444" />
                    <Text className="text-red-500 font-bold uppercase tracking-widest text-sm ml-3">
                        Terminate Session
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

/**
 * User Management Screen
 * Loads real user data from Supabase.
 */
export const UserManagementScreen: React.FC<AdminScreenProps> = ({ onNavigate }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, role, is_active, balance, total_earned, level, trust_score')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="User Management" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} />}
            >
                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-6 mb-4 px-2">
                    Contributors ({users.length})
                </Text>
                {loading && users.length === 0 ? (
                    <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : (
                    <View className="gap-4">
                        {users.map((user) => (
                            <View
                                key={user.id}
                                className="p-5 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-12 h-12 rounded-full bg-slate-700 items-center justify-center">
                                            <Text className="text-white font-bold">
                                                {(user.full_name || '??').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                                                {user.full_name}
                                            </Text>
                                            <Text className="text-xs text-slate-500 mt-1">{user.email}</Text>
                                            <Text className="text-[10px] text-slate-400 mt-0.5">Lvl {user.level} | Trust: {user.trust_score}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="font-bold text-primary">${(user.balance || 0).toFixed(2)}</Text>
                                        <View
                                            className={`px-2 py-1 rounded-full mt-1 ${user.is_active ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}
                                        >
                                            <Text
                                                className={`text-[10px] font-bold uppercase ${user.is_active ? 'text-emerald-500' : 'text-red-500'}`}
                                            >
                                                {user.is_active ? 'active' : 'suspended'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

/**
 * Task Moderation Screen
 * Loads real pending submissions, wires Approve/Reject buttons.
 */
export const TaskModerationScreen: React.FC<AdminScreenProps> = ({ onNavigate, session }) => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<'all' | 'voice' | 'image' | 'video' | 'text' | 'linguasense'>('all');

    const TYPE_FILTERS = [
        { value: 'all', label: 'All', icon: 'apps' },
        { value: 'voice', label: 'Voice', icon: 'mic' },
        { value: 'image', label: 'Image', icon: 'image' },
        { value: 'video', label: 'Video', icon: 'videocam' },
        { value: 'text', label: 'Text', icon: 'description' },
        { value: 'linguasense', label: 'LinguaSense', icon: 'translate' },
    ] as const;

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('submissions')
            .select(`
                id, task_id, user_id, submission_data, status, submitted_at,
                users(full_name, email),
                tasks(title, task_type, reward),
                submission_metadata(
                    user_name, user_language, user_country, user_role, user_level,
                    task_category, difficulty_level, platform,
                    file_size_bytes, duration_seconds
                )
            `)
            .eq('status', 'pending')
            .order('submitted_at', { ascending: true })
            .limit(50);

        if (!error && data) {
            setSubmissions(data);
        }
        setLoading(false);
    };

    const handleApprove = async (submissionId: string) => {
        if (!session?.user?.id) return;
        setProcessing(submissionId);
        try {
            const { error } = await supabase.rpc('admin_approve_submission', {
                p_admin_id: session.user.id,
                p_submission_id: submissionId,
            });
            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Approved', 'Submission approved and user credited.');
                setSubmissions(prev => prev.filter(s => s.id !== submissionId));
            }
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
        setProcessing(null);
    };

    const handleReject = async (submissionId: string) => {
        if (!session?.user?.id) return;
        Alert.alert(
            'Reject Submission',
            'Are you sure you want to reject this submission?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessing(submissionId);
                        try {
                            const { error } = await supabase.rpc('admin_reject_submission', {
                                p_admin_id: session.user.id,
                                p_submission_id: submissionId,
                            });
                            if (error) {
                                Alert.alert('Error', error.message);
                            } else {
                                setSubmissions(prev => prev.filter(s => s.id !== submissionId));
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message);
                        }
                        setProcessing(null);
                    },
                },
            ]
        );
    };

    const getTaskIcon = (taskType: string) => {
        switch (taskType) {
            case 'audio': case 'voice': return 'mic';
            case 'image': return 'image';
            case 'video': return 'videocam';
            case 'text': return 'description';
            case 'linguasense': return 'translate';
            default: return 'task';
        }
    };

    const filteredSubmissions = typeFilter === 'all'
        ? submissions
        : submissions.filter(s => {
            const taskType = s.tasks?.task_type || s.submission_data?.task_type || '';
            if (typeFilter === 'voice') return taskType === 'audio' || taskType === 'voice';
            return taskType === typeFilter;
        });

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Task Moderation" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            {/* Type Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-slate-100 dark:border-slate-800" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' }}>
                {TYPE_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        onPress={() => setTypeFilter(f.value)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: typeFilter === f.value ? '#1349ec' : 'rgba(0,0,0,0.05)' }}
                    >
                        <MaterialIcons name={f.icon as any} size={14} color={typeFilter === f.value ? '#fff' : '#94a3b8'} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: typeFilter === f.value ? '#fff' : '#94a3b8', letterSpacing: 0.5 }}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSubmissions} />}
            >
                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-6 mb-4 px-2">
                    Pending Review ({filteredSubmissions.length}{typeFilter !== 'all' ? ` of ${submissions.length}` : ''})
                </Text>

                {loading && submissions.length === 0 ? (
                    <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : filteredSubmissions.length === 0 ? (
                    <View className="items-center mt-16">
                        <MaterialIcons name="check-circle" size={48} color="#34d399" />
                        <Text className="text-slate-500 mt-4 text-sm">No pending submissions</Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        {filteredSubmissions.map((sub) => {
                            const taskType = sub.tasks?.task_type || sub.submission_data?.task_type || 'text';
                            const reward = sub.tasks?.reward || sub.submission_data?.total_reward || 0;
                            const userName = sub.users?.full_name || 'Unknown';
                            const isProcessing = processing === sub.id;
                            const isLinguaSense = taskType === 'linguasense';

                            return (
                                <View
                                    key={sub.id}
                                    className="p-5 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800"
                                    style={isProcessing ? { opacity: 0.5 } : undefined}
                                >
                                    <View className="flex-row items-center justify-between mb-4">
                                        <View className="flex-row items-center gap-3">
                                            <View className={`w-10 h-10 rounded-xl items-center justify-center ${isLinguaSense ? 'bg-violet-500/10' : 'bg-primary/10'}`}>
                                                <MaterialIcons
                                                    name={getTaskIcon(taskType) as any}
                                                    size={20}
                                                    color={isLinguaSense ? '#7c3aed' : '#1349ec'}
                                                />
                                            </View>
                                            <View>
                                                <Text className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                                                    {isLinguaSense ? 'LinguaSense' : taskType} Submission
                                                </Text>
                                                <Text className="text-xs text-slate-500">By {userName}</Text>
                                                <Text className="text-[10px] text-slate-400">
                                                    {new Date(sub.submitted_at).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text className="font-bold text-primary">${Number(reward).toFixed(2)}</Text>
                                    </View>

                                    {/* Show LinguaSense text content for review */}
                                    {isLinguaSense && sub.submission_data?.text_value && (
                                        <View className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3 mb-3">
                                            <Text className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Ground Truth Response</Text>
                                            <Text className="text-xs text-slate-700 dark:text-slate-300">{sub.submission_data.text_value}</Text>
                                        </View>
                                    )}

                                    {/* Auto-attached metadata — user profile, prompt context, device */}
                                    {(() => {
                                        // submission_metadata is returned as an array by Supabase (one-to-many join)
                                        const meta = Array.isArray(sub.submission_metadata)
                                            ? sub.submission_metadata[0]
                                            : sub.submission_metadata;

                                        const tags: { label: string; icon: string; color: string }[] = [];

                                        // User identity
                                        if (meta?.user_name) tags.push({ label: meta.user_name, icon: 'person', color: '#1349ec' });
                                        if (meta?.user_language) tags.push({ label: meta.user_language.toUpperCase(), icon: 'translate', color: '#7c3aed' });
                                        if (meta?.user_country) tags.push({ label: meta.user_country, icon: 'flag', color: '#0891b2' });
                                        if (meta?.user_role) tags.push({ label: meta.user_role, icon: 'badge', color: '#059669' });
                                        if (meta?.user_level) tags.push({ label: `Lvl ${meta.user_level}`, icon: 'military-tech', color: '#d97706' });

                                        // Prompt / task context
                                        if (meta?.task_category) tags.push({ label: meta.task_category, icon: 'category', color: '#db2777' });
                                        if (meta?.difficulty_level !== undefined && meta?.difficulty_level !== null) {
                                            const diff = meta.difficulty_level === 1 ? 'Easy' : meta.difficulty_level === 2 ? 'Medium' : 'Hard';
                                            tags.push({ label: diff, icon: 'speed', color: meta.difficulty_level === 1 ? '#10b981' : meta.difficulty_level === 2 ? '#f59e0b' : '#ef4444' });
                                        }

                                        // Device / file metrics
                                        if (meta?.platform) tags.push({ label: meta.platform, icon: 'phone-iphone', color: '#6366f1' });
                                        if (meta?.duration_seconds) tags.push({ label: `${meta.duration_seconds}s`, icon: 'timer', color: '#64748b' });
                                        if (meta?.file_size_bytes) tags.push({ label: `${Math.round(meta.file_size_bytes / 1024)}kb`, icon: 'data-usage', color: '#94a3b8' });

                                        if (tags.length === 0) return null;
                                        return (
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                                                {tags.map((t, i) => (
                                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, backgroundColor: `${t.color}15` }}>
                                                        <MaterialIcons name={t.icon as any} size={10} color={t.color} style={{ marginRight: 3 }} />
                                                        <Text style={{ fontSize: 9, fontWeight: '700', color: t.color, textTransform: 'uppercase', letterSpacing: 0.3 }}>{t.label}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    })()}

                                    {/* Show file URL if available */}
                                    {sub.submission_data?.file_url && (
                                        <Text className="text-[10px] text-slate-400 mb-3" numberOfLines={1}>
                                            File: {sub.submission_data.file_url}
                                        </Text>
                                    )}

                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            className="flex-1 h-10 bg-emerald-500 rounded-xl items-center justify-center"
                                            onPress={() => handleApprove(sub.id)}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text className="text-white font-bold text-xs uppercase">Approve</Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="flex-1 h-10 bg-red-500/10 rounded-xl items-center justify-center border border-red-500/20"
                                            onPress={() => handleReject(sub.id)}
                                            disabled={isProcessing}
                                        >
                                            <Text className="text-red-500 font-bold text-xs uppercase">Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

/**
 * Admin Payouts Screen
 * Shows real pending withdrawals with bank details. Admin can approve (manual payment) or reject.
 */
export const AdminPayoutsScreen: React.FC<AdminScreenProps> = ({ onNavigate, session }) => {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [totalPending, setTotalPending] = useState(0);
    const [refInput, setRefInput] = useState<Record<string, string>>({});

    useEffect(() => {
        loadWithdrawals();
    }, []);

    const loadWithdrawals = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('withdrawals')
            .select('id, user_id, amount, method, account_details, status, requested_at, users(full_name, email)')
            .in('status', ['pending', 'admin_review'])
            .order('requested_at', { ascending: true })
            .limit(50);

        if (!error && data) {
            setWithdrawals(data);
            setTotalPending(data.reduce((sum: number, w: any) => sum + Number(w.amount), 0));
        }
        setLoading(false);
    };

    const handleApprove = async (withdrawalId: string) => {
        if (!session?.user?.id) return;

        Alert.alert(
            'Confirm Payout',
            'Have you manually sent this payment? This will mark it as completed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Sent',
                    onPress: async () => {
                        setProcessing(withdrawalId);
                        try {
                            const { error } = await supabase.rpc('admin_approve_withdrawal', {
                                p_admin_id: session.user.id,
                                p_withdrawal_id: withdrawalId,
                                p_external_ref: refInput[withdrawalId] || null,
                            });
                            if (error) {
                                Alert.alert('Error', error.message);
                            } else {
                                Alert.alert('Done', 'Withdrawal marked as completed. User has been notified.');
                                setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message);
                        }
                        setProcessing(null);
                    },
                },
            ]
        );
    };

    const handleReject = async (withdrawalId: string) => {
        if (!session?.user?.id) return;

        Alert.alert(
            'Reject Withdrawal',
            'This will refund the amount to the user\'s balance.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject & Refund',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessing(withdrawalId);
                        try {
                            const { error } = await supabase.rpc('admin_reject_withdrawal', {
                                p_admin_id: session.user.id,
                                p_withdrawal_id: withdrawalId,
                            });
                            if (error) {
                                Alert.alert('Error', error.message);
                            } else {
                                Alert.alert('Rejected', 'Withdrawal rejected and funds returned to user.');
                                setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message);
                        }
                        setProcessing(null);
                    },
                },
            ]
        );
    };

    const formatBankDetails = (details: any): string => {
        if (!details) return 'No details provided';
        const parts: string[] = [];
        if (details.bankName) parts.push(details.bankName);
        if (details.accountHolder) parts.push(details.accountHolder);
        if (details.accountNumber) parts.push('Acc: ' + details.accountNumber);
        if (details.swiftCode) parts.push('SWIFT: ' + details.swiftCode);
        if (details.email) parts.push(details.email);
        if (details.currency) parts.push(details.currency);
        return parts.join(' | ') || JSON.stringify(details);
    };

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Payout Requests" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWithdrawals} />}
            >
                {/* Summary Card */}
                <View className="mt-6 p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
                                Pending Payouts
                            </Text>
                            <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                                ${totalPending.toFixed(2)}
                            </Text>
                            <Text className="text-xs text-slate-500 mt-1">
                                {withdrawals.length} request{withdrawals.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        <View className="w-14 h-14 rounded-2xl bg-orange-500/20 items-center justify-center">
                            <MaterialIcons name="payments" size={28} color="#f59e0b" />
                        </View>
                    </View>
                </View>

                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-8 mb-4 px-2">
                    Withdrawal Queue
                </Text>

                {loading && withdrawals.length === 0 ? (
                    <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : withdrawals.length === 0 ? (
                    <View className="items-center mt-16">
                        <MaterialIcons name="check-circle" size={48} color="#34d399" />
                        <Text className="text-slate-500 mt-4 text-sm">No pending withdrawals</Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        {withdrawals.map((w) => {
                            const isProcessing = processing === w.id;
                            const userName = w.users?.full_name || 'Unknown';
                            const userEmail = w.users?.email || '';
                            const methodLabel = w.method === 'bank_transfer' ? 'Bank Transfer'
                                : w.method === 'mobile_money' ? 'Mobile Money'
                                    : w.method === 'paypal' ? 'PayPal'
                                        : w.method;

                            return (
                                <View
                                    key={w.id}
                                    className="p-5 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800"
                                    style={isProcessing ? { opacity: 0.5 } : undefined}
                                >
                                    {/* Header: user + amount */}
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View>
                                            <Text className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                                                {userName}
                                            </Text>
                                            <Text className="text-xs text-slate-500 mt-0.5">{userEmail}</Text>
                                        </View>
                                        <Text className="font-bold text-xl text-slate-900 dark:text-white">
                                            ${Number(w.amount).toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* Method + Date */}
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className="px-2 py-1 rounded-full bg-primary/10">
                                            <Text className="text-[10px] font-bold text-primary uppercase">{methodLabel}</Text>
                                        </View>
                                        <Text className="text-[10px] text-slate-400">
                                            {new Date(w.requested_at).toLocaleDateString()}
                                        </Text>
                                    </View>

                                    {/* Bank Details */}
                                    <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3 border border-slate-200 dark:border-slate-700">
                                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            Payment Details
                                        </Text>
                                        <Text className="text-xs text-slate-700 dark:text-slate-300">
                                            {formatBankDetails(w.account_details)}
                                        </Text>
                                    </View>

                                    {/* Transaction Reference Input */}
                                    <TextInput
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 mb-3"
                                        placeholder="Transaction reference (optional)"
                                        placeholderTextColor="#94a3b8"
                                        value={refInput[w.id] || ''}
                                        onChangeText={(text) => setRefInput(prev => ({ ...prev, [w.id]: text }))}
                                    />

                                    {/* Action Buttons */}
                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            className="flex-1 h-12 bg-primary rounded-xl items-center justify-center"
                                            onPress={() => handleApprove(w.id)}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text className="text-white font-bold uppercase tracking-widest text-xs">
                                                    Approve & Mark Sent
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="h-12 px-4 bg-red-500/10 rounded-xl items-center justify-center border border-red-500/20"
                                            onPress={() => handleReject(w.id)}
                                            disabled={isProcessing}
                                        >
                                            <MaterialIcons name="close" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

/**
 * Admin Campaign Review Screen
 * Shows pending company task submissions for admin approval.
 */
export const AdminCampaignScreen: React.FC<AdminScreenProps> = ({ onNavigate, session }) => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Reward modal state
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [rewardInput, setRewardInput] = useState('0.15');

    const adminId = session?.user?.id || '';

    const loadCampaigns = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    id, title, description, task_type, status,
                    reward_per_submission, target_submissions, total_budget,
                    created_at, created_by,
                    companies:company_id ( name )
                `)
                .eq('status', 'pending_review')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (err) {
            console.error('[AdminCampaigns] load error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

    const openRewardModal = (campaign: any) => {
        setSelectedCampaign(campaign);
        setRewardInput('0.15');
        setShowRewardModal(true);
    };

    const confirmApprove = async () => {
        if (!selectedCampaign) return;
        const reward = parseFloat(rewardInput);
        if (isNaN(reward) || reward <= 0) {
            return Alert.alert('Invalid', 'Please enter a valid reward amount greater than 0.');
        }

        setIsProcessing(true);
        try {
            const { error } = await supabase.rpc('admin_approve_campaign', {
                p_admin_id: adminId,
                p_task_id: selectedCampaign.id,
                p_reward_per_submission: reward,
            });
            if (error) throw error;
            Alert.alert('Approved ✅', `Campaign is now live with $${reward.toFixed(2)}/item reward.`);
            setShowRewardModal(false);
            setSelectedCampaign(null);
            loadCampaigns();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to approve');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (taskId: string) => {
        Alert.alert(
            'Reject Request',
            'Are you sure? The company will be notified.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setIsProcessing(true);
                        try {
                            const { error } = await supabase.rpc('admin_reject_campaign', {
                                p_admin_id: adminId,
                                p_task_id: taskId,
                            });
                            if (error) throw error;
                            Alert.alert('Rejected', 'Request rejected. Company notified.');
                            loadCampaigns();
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to reject');
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const getTaskTypeIcon = (type: string) => {
        const map: Record<string, string> = { audio: 'mic', image: 'camera-alt', video: 'videocam', text: 'edit', validation: 'verified', linguasense: 'translate' };
        return map[type] || 'assignment';
    };

    const totalCost = selectedCampaign
        ? (parseFloat(rewardInput || '0') * (selectedCampaign.target_submissions || 0)).toFixed(2)
        : '0.00';

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Campaign Requests" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCampaigns(); }} tintColor="#f97316" />}
            >
                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-6 mb-4 px-2">
                    {loading ? 'Loading...' : `${campaigns.length} Pending Request${campaigns.length !== 1 ? 's' : ''}`}
                </Text>

                {!loading && campaigns.length === 0 && (
                    <View className="items-center justify-center py-20">
                        <MaterialIcons name="check-circle" size={48} color="#10b981" />
                        <Text className="text-white font-bold text-lg mt-4">All Clear</Text>
                        <Text className="text-slate-400 text-sm mt-2">No pending requests to review</Text>
                    </View>
                )}

                <View className="gap-4">
                    {campaigns.map((c) => (
                        <View
                            key={c.id}
                            className="p-5 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800"
                        >
                            <View className="flex-row items-start mb-3">
                                <View
                                    className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                                    style={{ backgroundColor: 'rgba(249,115,22,0.15)' }}
                                >
                                    <MaterialIcons name={getTaskTypeIcon(c.task_type) as any} size={24} color="#f97316" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-sm text-slate-900 dark:text-white" numberOfLines={1}>
                                        {c.title}
                                    </Text>
                                    <Text className="text-xs text-slate-500 mt-1">
                                        {c.companies?.name || 'Unknown Company'} · {c.task_type?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {c.description ? (
                                <Text className="text-xs text-slate-400 mb-3" numberOfLines={2}>
                                    {c.description}
                                </Text>
                            ) : null}

                            <View className="flex-row gap-4 mb-4">
                                <View className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                                    <Text className="text-xs text-slate-400 uppercase tracking-wider">Data Type</Text>
                                    <Text className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                                        {c.task_type}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                                    <Text className="text-xs text-slate-400 uppercase tracking-wider">Items Needed</Text>
                                    <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                        {c.target_submissions}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    className="flex-1 h-12 bg-emerald-500/10 rounded-xl items-center justify-center flex-row gap-2 border border-emerald-500/20"
                                    onPress={() => openRewardModal(c)}
                                    disabled={isProcessing}
                                >
                                    <MaterialIcons name="attach-money" size={18} color="#10b981" />
                                    <Text className="text-emerald-500 font-bold text-sm uppercase tracking-wider">Set Reward & Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="h-12 px-4 bg-red-500/10 rounded-xl items-center justify-center border border-red-500/20"
                                    onPress={() => handleReject(c.id)}
                                    disabled={isProcessing}
                                >
                                    <MaterialIcons name="close" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Set Reward Modal */}
            <Modal visible={showRewardModal} transparent animationType="fade" onRequestClose={() => setShowRewardModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: '#1e293b', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400 }}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
                            Set Reward Per Item
                        </Text>
                        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 20 }}>
                            {selectedCampaign?.title} — {selectedCampaign?.target_submissions} items
                        </Text>

                        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                            Reward ($ per item)
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: '#0f172a', color: '#fff', borderRadius: 12,
                                paddingHorizontal: 16, paddingVertical: 14, fontSize: 20,
                                fontWeight: '800', borderWidth: 1, borderColor: '#334155', marginBottom: 16,
                            }}
                            value={rewardInput}
                            onChangeText={setRewardInput}
                            keyboardType="decimal-pad"
                            placeholder="0.15"
                            placeholderTextColor="#475569"
                            autoFocus
                        />

                        {/* Cost summary */}
                        <View style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#334155' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ color: '#94a3b8', fontSize: 12 }}>Per item</Text>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>${parseFloat(rewardInput || '0').toFixed(2)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ color: '#94a3b8', fontSize: 12 }}>× {selectedCampaign?.target_submissions || 0} items</Text>
                                <Text style={{ color: '#fff', fontSize: 12 }}> </Text>
                            </View>
                            <View style={{ height: 1, backgroundColor: '#334155', marginVertical: 8 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '800' }}>Total Budget</Text>
                                <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '800' }}>${totalCost}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setShowRewardModal(false)}
                                style={{
                                    flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
                                }}
                            >
                                <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmApprove}
                                disabled={isProcessing}
                                style={{
                                    flex: 2, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'row', gap: 8,
                                    backgroundColor: '#10b981', opacity: isProcessing ? 0.6 : 1,
                                }}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <MaterialIcons name="check-circle" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Approve & Send</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

/**
 * Admin Audit Logs Screen
 * Shows a timeline of admin actions (approve/reject/payout) from the audit_logs table.
 */
export const AdminAuditLogsScreen: React.FC<AdminScreenProps> = ({ onNavigate }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState<string>('all');

    const ACTION_FILTERS = ['all', 'approve', 'reject', 'payout', 'campaign'];
    const ACTION_COLORS: Record<string, string> = {
        approve: '#10b981',
        reject: '#ef4444',
        payout: '#f59e0b',
        campaign: '#f97316',
        default: '#94a3b8',
    };

    useEffect(() => { loadLogs(); }, []);

    const loadLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select('id, admin_id, action, target_type, target_id, details, created_at, users:admin_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(100);
        if (!error && data) setLogs(data);
        setLoading(false);
    };

    const filtered = actionFilter === 'all' ? logs : logs.filter(l => l.action === actionFilter);

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Audit Logs" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-slate-100 dark:border-slate-800" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' }}>
                {ACTION_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        onPress={() => setActionFilter(f)}
                        style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: actionFilter === f ? '#1349ec' : 'rgba(0,0,0,0.05)' }}
                    >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: actionFilter === f ? '#fff' : '#94a3b8', textTransform: 'capitalize' }}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLogs} />}>
                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-6 mb-4 px-2">
                    {filtered.length} log{filtered.length !== 1 ? 's' : ''}
                </Text>
                {loading && logs.length === 0 ? (
                    <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : filtered.length === 0 ? (
                    <View className="items-center mt-16">
                        <MaterialIcons name="history" size={48} color="#94a3b8" />
                        <Text className="text-slate-500 mt-4 text-sm">No audit logs found</Text>
                    </View>
                ) : (
                    <View className="gap-3">
                        {filtered.map((log) => {
                            const color = ACTION_COLORS[log.action] || ACTION_COLORS.default;
                            return (
                                <View key={log.id} className="flex-row gap-3 items-start">
                                    <View style={{ width: 2, backgroundColor: color, marginTop: 6, alignSelf: 'stretch', borderRadius: 1, marginLeft: 6 }} />
                                    <View className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${color}20` }}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color, textTransform: 'uppercase' }}>{log.action}</Text>
                                            </View>
                                            <Text className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</Text>
                                        </View>
                                        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                                            {log.target_type} — {log.target_id?.substring(0, 8)}...
                                        </Text>
                                        {log.users?.full_name && (
                                            <Text className="text-[10px] text-slate-400 mt-0.5">By {log.users.full_name}</Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

/**
 * Admin Fraud Detection Screen
 * Flags users with high rejection rates or low trust scores.
 */
export const AdminFraudDetectionScreen: React.FC<AdminScreenProps> = ({ onNavigate, session }) => {
    const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => { loadFlaggedUsers(); }, []);

    const loadFlaggedUsers = async () => {
        setLoading(true);
        // Flag users with trust_score < 30 or very high rejection counts
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, trust_score, total_earned, level, is_active, role')
            .lt('trust_score', 30)
            .order('trust_score', { ascending: true })
            .limit(50);
        if (!error && data) setFlaggedUsers(data);
        setLoading(false);
    };

    const handleSuspend = async (userId: string) => {
        if (!session?.user?.id) return;
        Alert.alert('Suspend User', 'This will prevent the user from submitting tasks.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Suspend',
                style: 'destructive',
                onPress: async () => {
                    setProcessing(userId);
                    const { error } = await supabase
                        .from('users')
                        .update({ is_active: false, role: 'suspended' })
                        .eq('id', userId);
                    if (error) {
                        Alert.alert('Error', error.message);
                    } else {
                        setFlaggedUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'suspended', is_active: false } : u));
                    }
                    setProcessing(null);
                },
            },
        ]);
    };

    const handleDismiss = (userId: string) => {
        setFlaggedUsers(prev => prev.filter(u => u.id !== userId));
    };

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Fraud Detection" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFlaggedUsers} />}>
                <View className="mt-6 p-5 rounded-3xl bg-red-500/10 border border-red-500/20 mb-6">
                    <Text className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Flagged Users</Text>
                    <Text className="text-2xl font-bold text-slate-900 dark:text-white">{flaggedUsers.length} users</Text>
                    <Text className="text-xs text-slate-400 mt-1">Trust score below 30 — potential fraud or low-quality contributors</Text>
                </View>

                {loading && flaggedUsers.length === 0 ? (
                    <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : flaggedUsers.length === 0 ? (
                    <View className="items-center mt-16">
                        <MaterialIcons name="verified-user" size={48} color="#10b981" />
                        <Text className="text-slate-500 mt-4 text-sm">No flagged users</Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        {flaggedUsers.map((user) => (
                            <View key={user.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-red-200 dark:border-red-900/30">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View>
                                        <Text className="font-bold text-sm text-slate-900 dark:text-white">{user.full_name || 'Unknown'}</Text>
                                        <Text className="text-xs text-slate-400">{user.email}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#ef4444' }}>{user.trust_score ?? '?'}</Text>
                                        <Text className="text-[10px] text-slate-400">trust score</Text>
                                    </View>
                                </View>
                                <View className="flex-row gap-2 mt-1">
                                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: user.is_active ? '#10b98120' : '#ef444420' }}>
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: user.is_active ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                                            {user.role || (user.is_active ? 'active' : 'suspended')}
                                        </Text>
                                    </View>
                                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#1349ec20' }}>
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#1349ec', textTransform: 'uppercase' }}>Lvl {user.level}</Text>
                                    </View>
                                </View>
                                <View className="flex-row gap-3 mt-3">
                                    {user.role !== 'suspended' && (
                                        <TouchableOpacity
                                            className="flex-1 h-9 bg-red-500/10 rounded-xl items-center justify-center border border-red-500/20"
                                            onPress={() => handleSuspend(user.id)}
                                            disabled={processing === user.id}
                                        >
                                            {processing === user.id ? (
                                                <ActivityIndicator size="small" color="#ef4444" />
                                            ) : (
                                                <Text className="text-red-500 font-bold text-xs uppercase">Suspend</Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        className="flex-1 h-9 bg-slate-200/50 dark:bg-slate-700 rounded-xl items-center justify-center"
                                        onPress={() => handleDismiss(user.id)}
                                    >
                                        <Text className="text-slate-500 dark:text-slate-300 font-bold text-xs uppercase">Dismiss Flag</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

/**
 * Admin Sessions Screen
 * Shows recently active users ordered by last_active_at.
 */
export const AdminSessionsScreen: React.FC<AdminScreenProps> = ({ onNavigate }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d'>('24h');

    const TIME_FILTERS = [
        { key: '1h' as const, label: 'Last Hour' },
        { key: '24h' as const, label: 'Last 24h' },
        { key: '7d' as const, label: 'Last 7 Days' },
    ];

    const getThreshold = () => {
        const now = new Date();
        if (timeFilter === '1h') now.setHours(now.getHours() - 1);
        else if (timeFilter === '24h') now.setDate(now.getDate() - 1);
        else now.setDate(now.getDate() - 7);
        return now.toISOString();
    };

    useEffect(() => { loadSessions(); }, [timeFilter]);

    const loadSessions = async () => {
        setLoading(true);
        const threshold = getThreshold();
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, last_active_at, country, level, role, is_active')
            .gte('last_active_at', threshold)
            .order('last_active_at', { ascending: false })
            .limit(100);
        if (!error && data) setUsers(data);
        setLoading(false);
    };

    const formatRelative = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Active Sessions" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.1)' }}>
                {TIME_FILTERS.map(({ key, label }) => (
                    <TouchableOpacity
                        key={key}
                        onPress={() => setTimeFilter(key)}
                        style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: timeFilter === key ? '#1349ec' : 'rgba(0,0,0,0.05)', alignItems: 'center' }}
                    >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: timeFilter === key ? '#fff' : '#94a3b8' }}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSessions} />}>
                <View className="flex-row items-center justify-between mt-4 mb-4 px-2">
                    <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        {users.length} session{users.length !== 1 ? 's' : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                        <Text className="text-xs text-emerald-500 font-bold">Live</Text>
                    </View>
                </View>
                {loading && users.length === 0 ? (
                    <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : users.length === 0 ? (
                    <View className="items-center mt-16">
                        <MaterialIcons name="sensors-off" size={48} color="#94a3b8" />
                        <Text className="text-slate-500 mt-4 text-sm">No active sessions</Text>
                    </View>
                ) : (
                    <View className="gap-3">
                        {users.map((u) => (
                            <View key={u.id} className="flex-row items-center p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
                                <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center mr-3">
                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                                        {(u.full_name || '??').substring(0, 2).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-semibold text-sm text-slate-900 dark:text-white">{u.full_name || 'Unknown'}</Text>
                                    <Text className="text-[10px] text-slate-400">{u.email}</Text>
                                    {u.country && <Text className="text-[10px] text-slate-400">{u.country} · Lvl {u.level}</Text>}
                                </View>
                                <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '600' }}>
                                    {u.last_active_at ? formatRelative(u.last_active_at) : '—'}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

/**
 * Admin Lexicon Orchestrator Screen
 * Shows lexicon campaign coverage by language and allows boosting or creating campaigns.
 */
export const AdminLexiconOrchestratorScreen: React.FC<AdminScreenProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('lexicon_submissions')
            .select('language, status')
            .limit(5000);

        if (!error && data) {
            // Group by language
            const grouped: Record<string, { pending: number; approved: number; rejected: number; total: number }> = {};
            (data as any[]).forEach((row) => {
                const lang = row.language || 'unknown';
                if (!grouped[lang]) grouped[lang] = { pending: 0, approved: 0, rejected: 0, total: 0 };
                grouped[lang].total++;
                if (row.status === 'approved') grouped[lang].approved++;
                else if (row.status === 'rejected') grouped[lang].rejected++;
                else grouped[lang].pending++;
            });
            setStats(Object.entries(grouped).map(([language, counts]) => ({ language, ...counts })));
        }
        setLoading(false);
    };

    const handleBoost = async (language: string) => {
        Alert.alert(
            'Boost Language',
            `Increase reward multiplier for "${language}" tasks by 50%?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Boost',
                    onPress: async () => {
                        const { error } = await supabase.rpc('boost_language_reward', { p_language: language, p_multiplier: 1.5 });
                        if (error) {
                            Alert.alert('Error', error.message || 'Failed to boost (RPC may not exist yet)');
                        } else {
                            Alert.alert('Boosted', `Rewards for "${language}" tasks are now 1.5x.`);
                        }
                    },
                },
            ]
        );
    };

    const handleGenerateDataset = async () => {
        Alert.prompt(
            'Generate Lexicon Dataset',
            'Enter a name for this dataset (e.g., "Swahili Greetings V1"):',
            async (name) => {
                if (!name) return;
                setLoading(true);
                const { success, error } = await DatasetService.generateLexiconDataset(name);
                setLoading(false);

                if (success) {
                    Alert.alert('Dataset Created', `Successfully generated dataset "${name}" from approved submissions.`);
                } else {
                    Alert.alert('Generation Failed', error || 'Check if the SQL function exists.');
                }
            }
        );
    };

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Lexicon Orchestrator" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} />}>
                <View className="flex-row items-center justify-between mt-6 mb-4 px-2">
                    <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Language Coverage
                    </Text>
                    <TouchableOpacity
                        onPress={handleGenerateDataset}
                        className="bg-emerald-500 px-4 py-2 rounded-full flex-row items-center gap-2"
                    >
                        <MaterialIcons name="auto-fix-high" size={16} color="white" />
                        <Text className="text-white text-[10px] font-bold uppercase">Generate Dataset</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : stats.length === 0 ? (
                    <View className="items-center mt-16">
                        <MaterialIcons name="language" size={48} color="#94a3b8" />
                        <Text className="text-slate-500 mt-4 text-sm">No lexicon data yet</Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        {stats.sort((a, b) => b.total - a.total).map((item) => {
                            const approvalRate = item.total > 0 ? Math.round((item.approved / item.total) * 100) : 0;
                            return (
                                <View key={item.language} className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="font-bold text-sm text-slate-900 dark:text-white uppercase">{item.language}</Text>
                                        <Text className="font-bold text-slate-900 dark:text-white">{item.total} total</Text>
                                    </View>
                                    <View style={{ height: 6, backgroundColor: 'rgba(148,163,184,0.2)', borderRadius: 3, marginBottom: 8 }}>
                                        <View style={{ height: 6, backgroundColor: '#10b981', borderRadius: 3, width: `${approvalRate}%` }} />
                                    </View>
                                    <View className="flex-row gap-3 mb-3">
                                        {[
                                            { label: 'Approved', value: item.approved, color: '#10b981' },
                                            { label: 'Pending', value: item.pending, color: '#f59e0b' },
                                            { label: 'Rejected', value: item.rejected, color: '#ef4444' },
                                        ].map(({ label, value, color }) => (
                                            <View key={label} style={{ flex: 1, backgroundColor: `${color}15`, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                                                <Text style={{ fontSize: 14, fontWeight: '800', color }}>{value}</Text>
                                                <Text style={{ fontSize: 9, color, fontWeight: '600', textTransform: 'uppercase' }}>{label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <TouchableOpacity
                                        className="h-9 rounded-xl items-center justify-center"
                                        style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' }}
                                        onPress={() => handleBoost(item.language)}
                                    >
                                        <Text style={{ color: '#f59e0b', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}>
                                            Boost Rewards
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

/**
 * Admin Marketplace Management Screen
 * Manages the transition of internal datasets to the public marketplace.
 */
export const AdminMarketplaceManagementScreen: React.FC<AdminScreenProps> = ({ onNavigate }) => {
    const [datasets, setDatasets] = useState<DatasetService.Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [publishModalVisible, setPublishModalVisible] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<DatasetService.Dataset | null>(null);

    // Publish Form State
    const [price, setPrice] = useState('299.00');
    const [language, setLanguage] = useState('en');
    const [publishing, setPublishing] = useState(false);

    useEffect(() => { loadDatasets(); }, []);

    const loadDatasets = async () => {
        setLoading(true);
        const data = await DatasetService.getDatasets();
        setDatasets(data);
        setLoading(false);
    };

    const handleOpenPublish = (dataset: DatasetService.Dataset) => {
        setSelectedDataset(dataset);
        setLanguage(dataset.metadata?.language || 'en');
        setPublishModalVisible(true);
    };

    const handleConfirmPublish = async () => {
        if (!selectedDataset) return;
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            Alert.alert('Invalid Price', 'Please enter a valid USD amount.');
            return;
        }

        setPublishing(true);
        const { success, error } = await DatasetService.publishDatasetToMarketplace(selectedDataset.id, {
            priceUsd: priceNum,
            language: language,
            description: selectedDataset.description
        });
        setPublishing(false);

        if (success) {
            Alert.alert('Published', `"${selectedDataset.name}" is now live in the marketplace!`);
            setPublishModalVisible(false);
            loadDatasets();
        } else {
            Alert.alert('Publishing Failed', error || 'Unexpected error occurred.');
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <Header title="Marketplace Management" onBack={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} />

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDatasets} />}
            >
                <View className="mt-6 mb-4 px-2">
                    <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Internal Datasets
                    </Text>
                    <Text className="text-slate-500 text-[10px] mt-1"> Transition verified datasets to the public store </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : datasets.length === 0 ? (
                    <View className="items-center mt-16">
                        <MaterialIcons name="inventory-2" size={48} color="#94a3b8" />
                        <Text className="text-slate-500 mt-4 text-sm">No datasets built yet</Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        {datasets.map((ds) => (
                            <View key={ds.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-1">
                                        <Text className="font-bold text-sm text-slate-900 dark:text-white">{ds.name}</Text>
                                        <Text className="text-[10px] text-slate-400 mt-0.5 uppercase font-bold">{ds.task_type} • {ds.item_count} items</Text>
                                    </View>
                                    <View style={{
                                        backgroundColor: ds.status === 'exported' ? '#10b98120' : '#3b82f620',
                                        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6
                                    }}>
                                        <Text style={{
                                            color: ds.status === 'exported' ? '#10b981' : '#3b82f6',
                                            fontSize: 9, fontWeight: '800', textTransform: 'uppercase'
                                        }}>
                                            {ds.status}
                                        </Text>
                                    </View>
                                </View>

                                {ds.description && (
                                    <Text className="text-slate-500 text-[11px] mb-4 leading-relaxed">
                                        {ds.description}
                                    </Text>
                                )}

                                {ds.status === 'ready' && (
                                    <TouchableOpacity
                                        onPress={() => handleOpenPublish(ds)}
                                        className="bg-emerald-500 h-10 rounded-xl items-center justify-center flex-row gap-2"
                                    >
                                        <MaterialIcons name="publish" size={18} color="white" />
                                        <Text className="text-white font-bold text-xs uppercase">Publish to Marketplace</Text>
                                    </TouchableOpacity>
                                )}

                                {ds.status === 'exported' && (
                                    <View className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800 items-center justify-center">
                                        <Text className="text-slate-400 font-bold text-xs uppercase italic">Already in Marketplace</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Publishing Modal */}
            <Modal
                visible={publishModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPublishModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-surface-dark rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white">Publish Dataset</Text>
                            <TouchableOpacity onPress={() => setPublishModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-400 font-bold text-[10px] uppercase mb-2">Set Marketplace Price (USD)</Text>
                        <TextInput
                            value={price}
                            onChangeText={setPrice}
                            placeholder="299.00"
                            keyboardType="numeric"
                            className="bg-slate-50 dark:bg-background-dark p-4 rounded-xl text-slate-900 dark:text-white font-bold mb-4 border border-slate-100 dark:border-slate-800"
                        />

                        <Text className="text-slate-400 font-bold text-[10px] uppercase mb-2">Primary Language (ISO Code)</Text>
                        <TextInput
                            value={language}
                            onChangeText={setLanguage}
                            placeholder="en"
                            className="bg-slate-50 dark:bg-background-dark p-4 rounded-xl text-slate-900 dark:text-white font-bold mb-8 border border-slate-100 dark:border-slate-800"
                        />

                        <TouchableOpacity
                            onPress={handleConfirmPublish}
                            disabled={publishing}
                            className="bg-emerald-500 p-4 rounded-2xl items-center"
                        >
                            {publishing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-base">CONFIRM & PUBLISH</Text>
                            )}
                        </TouchableOpacity>
                        <Text className="text-center text-slate-400 text-[10px] mt-4 italic">
                            This will create a public listing in the Dataset Marketplace.
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
