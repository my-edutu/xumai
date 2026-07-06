import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ImageBackground, StyleSheet, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import * as TaskService from '../services/taskService';
import { getFeaturedTasks, getDailyMissions, getFeedTasks } from '../services/marketplaceService';
import { getActiveCampaignsForFeed } from '../services/campaignService';
import { getUserEarningsPeriod } from '../services/walletService';
import { BottomNavigation } from '../components/BottomNavigation';
import { XumJudgeItems } from '../components/XumJudgeItems';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { Avatar, Badge, Card } from '../components/primitives';
import { SPACING, TYPOGRAPHY, LAYOUT, SHADOWS, TEXT_STYLES } from '../constants/designTokens';
import { rgba } from '../utils/styleUtils';

interface HomeProps {
    onNavigate: (s: ScreenName) => void;
    balance: number;
    onOpenNeuralInput: () => void;
    onOpenContributorHub: () => void;
    session: any;
}



export const HomeScreen = ({
    onNavigate,
    balance,
    onOpenNeuralInput,
    onOpenContributorHub,
    session,
}: HomeProps) => {
    const { theme, themeId } = useTheme();

    const [feedTasks, setFeedTasks] = useState<any[]>([]);
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [earningsPeriod, setEarningsPeriod] = useState({ today: 0, month: 0 });
    const [isLoadingFeed, setIsLoadingFeed] = useState(true);
    const [featuredTasks, setFeaturedTasks] = useState<any[]>([]);
    const [missions, setMissions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [streakDays, setStreakDays] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!session?.user?.id) return;

        const loadData = async () => {
            try {
                const [fTasks, dMissions, uStats, periodStats, campaigns] = await Promise.all([
                    getFeaturedTasks(),
                    getDailyMissions(session.user.id),
                    TaskService.getUserTaskStats(session.user.id),
                    getUserEarningsPeriod(session.user.id),
                    getActiveCampaignsForFeed({ limit: 6 }),
                ]);
                setFeaturedTasks(fTasks.filter((task: any) => task.title !== 'Verify AI Translations'));
                setMissions(dMissions);
                setStats(uStats);
                setEarningsPeriod(periodStats);
                setActiveCampaigns(campaigns);

                // Calculate streak from users table (column may not exist yet — silently ignored)
                try {
                    const { data: userData } = await (await import('../supabaseClient')).supabase
                        .from('users')
                        .select('streak_count')
                        .eq('id', session.user.id)
                        .single();
                    if (userData?.streak_count) setStreakDays(userData.streak_count);
                } catch (_) { }
            } catch (error) {
                console.error('Error loading home data:', error);
            }
        };

        loadData();
    }, [session?.user?.id, balance]);

    const onRefresh = React.useCallback(async () => {
        if (!session?.user?.id) return;
        setRefreshing(true);
        try {
            const [fTasks, dMissions, uStats, periodStats, campaigns] = await Promise.all([
                getFeaturedTasks(),
                getDailyMissions(session.user.id),
                TaskService.getUserTaskStats(session.user.id),
                getUserEarningsPeriod(session.user.id),
                getActiveCampaignsForFeed({ limit: 6 }),
            ]);
            setFeaturedTasks(fTasks.filter((task: any) => task.title !== 'Verify AI Translations'));
            setMissions(dMissions);
            setStats(uStats);
            setEarningsPeriod(periodStats);
            setActiveCampaigns(campaigns);

            // Reload feed as well
            const tasks = await getFeedTasks(selectedCategory);
            if (tasks && tasks.length > 0) {
                setFeedTasks(tasks);
            }
        } catch (error) {
            console.error('Error refreshing home data:', error);
        } finally {
            setRefreshing(false);
        }
    }, [session?.user?.id, selectedCategory]);

    // Mock Feed Data as fallback
    const FEED_DATA = [
        { id: '1', type: 'Voice', title: 'Train AI through Voice Recording', subtitle: 'Help train AI assistants', reward: 1.50, time: '2 min', difficulty: 'Easy', icon: 'mic', color: '#ec4899', screen: ScreenName.VOICE_TASK },
        { id: '2', type: 'Image', title: 'Train AI through Image Capture', subtitle: 'Draw bounding boxes', reward: 0.80, time: '1 min', difficulty: 'Medium', icon: 'image', color: '#8b5cf6', screen: ScreenName.IMAGE_TASK },
        { id: '3', type: 'Text', title: 'Sentiment Analysis', subtitle: 'Rate customer reviews', reward: 0.50, time: '1 min', difficulty: 'Easy', icon: 'text-fields', color: '#3b82f6', screen: ScreenName.LINGUASENSE_ENGINE },
        { id: '4', type: 'Video', title: 'Train AI through Video Collection', subtitle: 'Record specific gestures', reward: 5.00, time: '5 min', difficulty: 'Hard', icon: 'videocam', color: '#10b981', screen: ScreenName.VIDEO_TASK },
    ];

    const [selectedCategory, setSelectedCategory] = useState('All');

    // Fetch feed when category changes
    useEffect(() => {
        const loadFeed = async () => {
            setIsLoadingFeed(true);
            try {
                const tasks = await getFeedTasks(selectedCategory);
                if (tasks && tasks.length > 0) {
                    setFeedTasks(tasks);
                } else {
                    // Fallback to mock data if no real tasks
                    const filtered = selectedCategory === 'All'
                        ? FEED_DATA
                        : FEED_DATA.filter(t => t.type === selectedCategory);
                    setFeedTasks(filtered);
                }
            } catch (error) {
                console.warn('Failed to fetch tasks, using fallback', error);
                const filtered = selectedCategory === 'All'
                    ? FEED_DATA
                    : FEED_DATA.filter(t => t.type === selectedCategory);
                setFeedTasks(filtered);
            } finally {
                setIsLoadingFeed(false);
            }
        };
        loadFeed();
    }, [selectedCategory]);

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.flex1}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: Platform.OS === 'android' ? 24 : SPACING.sm }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.primary]} // Android
                        tintColor={theme.primary} // iOS
                    />
                }
            >
                {/* Header */}
                <View style={styles.homeHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 }}>
                                Welcome back
                            </Text>
                            <Text style={[TEXT_STYLES.h4, { color: theme.text, fontWeight: '700', letterSpacing: 1, fontSize: 24 }]}>
                                XUM <Text style={{ color: theme.primary }}>AI</Text>
                            </Text>
                        </View>
                        {streakDays > 0 && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(245, 158, 11, 0.3)',
                                gap: 4,
                            }}>
                                <Text style={{ fontSize: 14 }}>🔥</Text>
                                <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 13 }}>
                                    {streakDays}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Avatar
                        source={session?.user?.user_metadata?.avatar_url}
                        initials={session?.user?.email?.[0].toUpperCase() || 'C'}
                        size="md"
                        showStatus
                        online
                        onPress={() => onNavigate(ScreenName.PROFILE)}
                    />
                </View>

                {/* Earnings Stats Bar - Redesigned */}
                <View style={styles.statsRow}>
                    <Card style={{ flex: 1, padding: SPACING.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: rgba(theme.primary, 0.14), alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                <MaterialIcons name="today" size={15} color={theme.primary} />
                            </View>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>EARNED TODAY</Text>
                        </View>
                        <Text style={{ fontSize: 23, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>
                            ${earningsPeriod.today.toFixed(2)}
                        </Text>
                    </Card>
                    <Card style={{ flex: 1, padding: SPACING.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: rgba(theme.success, 0.14), alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                <MaterialIcons name="date-range" size={15} color={theme.success} />
                            </View>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>THIS MONTH</Text>
                        </View>
                        <Text style={{ fontSize: 23, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>
                            ${earningsPeriod.month.toFixed(2)}
                        </Text>
                    </Card>
                </View>

                {/* Leaderboard Card - Moved Up */}
                <TouchableOpacity
                    onPress={() => onNavigate(ScreenName.LEADERBOARD)}
                    activeOpacity={0.9}
                    style={{ marginBottom: SPACING.lg }}
                >
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop' }}
                        style={[styles.networkCard, { height: 160 }]}
                        imageStyle={{ opacity: 0.4 }}
                    >
                        <LinearGradient
                            colors={['transparent', themeId === 'light' ? rgba('#000', 0.6) : rgba(theme.background, 0.9)]}
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={{ padding: SPACING.lg, zIndex: 2, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={[TEXT_STYLES.h4, { color: '#fff', marginBottom: 4, fontSize: 22, lineHeight: 28 }]}>
                                    Global{'\n'}Leaderboard
                                </Text>
                                <View style={[styles.leaderboardBadge, { backgroundColor: rgba('#fff', 0.15), marginBottom: 0, alignSelf: 'flex-start' }]}>
                                    <Text style={[TEXT_STYLES.label, { color: '#fff', fontSize: 10 }]}>WEEKLY RANKING</Text>
                                </View>
                            </View>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialIcons name="emoji-events" size={24} color="#ffd700" />
                            </View>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>

                {/* Featured Tasks Section */}
                {featuredTasks.length > 0 && (
                    <View style={{ marginBottom: SPACING.lg }}>
                        <View style={styles.sectionHeader}>
                            <Text style={[TEXT_STYLES.h6, { color: theme.text }]}>Featured</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: SPACING.md }}>
                            {featuredTasks.map((task) => (
                                <TouchableOpacity
                                    key={task.id}
                                    style={[styles.featuredPromoCardSmall, { backgroundColor: theme.surface, marginRight: SPACING.md }]}
                                    onPress={() => onNavigate(task.target_screen as ScreenName)}
                                >
                                    <LinearGradient
                                        colors={[task.gradient_start || theme.primary, task.gradient_end || theme.primaryDark]}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                    <View style={styles.featuredPromoContent}>
                                        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4, textAlign: 'left', lineHeight: 22 }} numberOfLines={2}>{task.title}</Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, textAlign: 'left', lineHeight: 16 }} numberOfLines={2}>{task.subtitle}</Text>
                                    </View>
                                    {/* Removed icon container for clean 'exam card' look */}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* XUM Judge Quick Access */}
                <TouchableOpacity
                    onPress={() => onNavigate(ScreenName.XUM_JUDGE)}
                    activeOpacity={0.9}
                    style={{
                        backgroundColor: theme.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: SPACING.md,
                        borderWidth: 1,
                        borderColor: 'rgba(139, 92, 246, 0.25)',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View style={{
                        width: 48, height: 48, borderRadius: 24,
                        backgroundColor: 'rgba(139, 92, 246, 0.12)',
                        justifyContent: 'center', alignItems: 'center',
                        marginRight: 14,
                    }}>
                        <MaterialIcons name="balance" size={24} color="#8b5cf6" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>XUM Judge</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
                            Complete more tasks to unlock
                        </Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
                        <Text style={{ color: '#8b5cf6', fontWeight: '700', fontSize: 12 }}>Elite</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* XUM Lexicon Quick Access */}
                <TouchableOpacity
                    onPress={() => onNavigate(ScreenName.LEXICON_TASK)}
                    activeOpacity={0.9}
                    style={{
                        backgroundColor: theme.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: SPACING.lg,
                        borderWidth: 1,
                        borderColor: `${theme.primary}30`,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View style={{
                        width: 48, height: 48, borderRadius: 24,
                        backgroundColor: `${theme.primary}15`,
                        justifyContent: 'center', alignItems: 'center',
                        marginRight: 14,
                    }}>
                        <Text style={{ fontSize: 24 }}>🧠</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>XUM Lexicon</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                            Name the world in your language — earn up to $4.50
                        </Text>
                    </View>
                    <View style={{ backgroundColor: `${theme.success}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
                        <Text style={{ color: theme.success, fontWeight: '700', fontSize: 12 }}>+1.5x</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* Validate & Earn */}
                <TouchableOpacity
                    onPress={() => onNavigate(ScreenName.SUBMISSION_VALIDATION)}
                    activeOpacity={0.9}
                    style={{
                        backgroundColor: theme.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: SPACING.lg,
                        borderWidth: 1,
                        borderColor: 'rgba(16, 185, 129, 0.25)',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View style={{
                        width: 48, height: 48, borderRadius: 24,
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        justifyContent: 'center', alignItems: 'center',
                        marginRight: 14,
                    }}>
                        <MaterialIcons name="rate-review" size={24} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>Validate & Earn</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                            Review others' work • +$0.08 per vote
                        </Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
                        <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 12 }}>+$0.08</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* New Company Campaigns Section */}
                {activeCampaigns.length > 0 && (
                    <View style={{ marginBottom: SPACING.lg }}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary }} />
                                <Text style={[TEXT_STYLES.h6, { color: theme.text }]}>New Company Campaigns</Text>
                            </View>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingRight: SPACING.md }}
                        >
                            {activeCampaigns.map((campaign) => (
                                <TouchableOpacity
                                    key={campaign.id}
                                    style={[styles.campaignCard, { marginRight: SPACING.md }]}
                                    onPress={() => onNavigate(campaign.screen as ScreenName, { campaignId: campaign.id })}
                                    activeOpacity={0.88}
                                >
                                    <LinearGradient
                                        colors={[campaign.gradientStart || '#be185d', campaign.gradientEnd || '#f97316']}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                    {/* CAMPAIGN badge */}
                                    <View style={styles.campaignBadge}>
                                        <Text style={styles.campaignBadgeText}>CAMPAIGN</Text>
                                    </View>
                                    {/* Icon */}
                                    <View style={styles.campaignIconCircle}>
                                        <MaterialIcons name={campaign.icon as any} size={26} color="#fff" />
                                    </View>
                                    {/* Info */}
                                    <Text style={styles.campaignTitle} numberOfLines={2}>{campaign.title}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                        <Text style={styles.campaignReward}>${Number(campaign.reward).toFixed(2)}/item</Text>
                                        {campaign.daysLeft != null && (
                                            <View style={styles.campaignDaysLeft}>
                                                <MaterialIcons name="schedule" size={11} color="rgba(255,255,255,0.85)" />
                                                <Text style={styles.campaignDaysLeftText}>{campaign.daysLeft}d left</Text>
                                            </View>
                                        )}
                                    </View>
                                    {/* Progress bar */}
                                    {campaign.progressPercent != null && (
                                        <View style={[styles.campaignProgressTrack, { marginTop: 10 }]}>
                                            <View style={[styles.campaignProgressFill, { width: `${Math.min(campaign.progressPercent, 100)}%` }]} />
                                        </View>
                                    )}
                                    {/* Start Now button */}
                                    <TouchableOpacity
                                        style={styles.campaignStartBtn}
                                        onPress={() => onNavigate(campaign.screen as ScreenName, { campaignId: campaign.id })}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.campaignStartBtnText}>Start Now</Text>
                                        <MaterialIcons name="arrow-forward" size={14} color="#fff" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Category Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: SPACING.sm, paddingBottom: SPACING.md }}
                >
                    {['All', 'Voice', 'Text', 'Image', 'Video', 'Validation'].map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={{
                                marginRight: 12,
                                paddingHorizontal: 20,
                                paddingVertical: 8, // Reduced height
                                borderRadius: 20,
                                backgroundColor: selectedCategory === cat ? theme.primary : theme.surface,
                                borderWidth: 1,
                                borderColor: selectedCategory === cat ? theme.primary : theme.border
                            }}
                        >
                            <Text style={{
                                color: selectedCategory === cat ? '#fff' : theme.textSecondary,
                                fontWeight: '600',
                                fontSize: 13
                            }}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Task Feed */}
                <View style={{ marginTop: SPACING.sm }}>
                    <Text style={[TEXT_STYLES.h4, { color: theme.text, marginBottom: SPACING.md, fontSize: 17, fontWeight: '700' }]}>
                        Available Tasks
                    </Text>

                    {isLoadingFeed ? (
                        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <>
                            {feedTasks.map((task) => (
                                <TouchableOpacity
                                    key={task.id}
                                    onPress={() => onNavigate(task.screen)}
                                    activeOpacity={0.9}
                                    style={{
                                        backgroundColor: theme.surface,
                                        borderRadius: LAYOUT.radius.lg,
                                        padding: SPACING.md,
                                        marginBottom: SPACING.md,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                >
                                    <View style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 24,
                                        backgroundColor: rgba(task.color, 0.1),
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: SPACING.md
                                    }}>
                                        <MaterialIcons name={task.icon as any} size={24} color={task.color} />
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <View style={{ marginBottom: 4 }}>
                                            <Text style={[TEXT_STYLES.body, { color: theme.text, fontWeight: '700', fontSize: 15 }]}>{task.title}</Text>
                                        </View>
                                        <Text style={[TEXT_STYLES.caption, { color: theme.textSecondary, marginBottom: 8 }]} numberOfLines={1}>{task.subtitle}</Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                            <Text style={[TEXT_STYLES.body, { color: theme.success, fontWeight: '800' }]}>${Number(task.reward).toFixed(2)}</Text>

                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                    <MaterialIcons name="schedule" size={12} color={theme.textSecondary} style={{ marginRight: 4 }} />
                                                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>{task.time}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                    <MaterialIcons name="signal-cellular-alt" size={12} color={theme.textSecondary} style={{ marginRight: 4 }} />
                                                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>{task.difficulty}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            ))}

                            {feedTasks.length === 0 && (
                                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialIcons name="filter-list-off" size={48} color={theme.textTertiary} />
                                    <Text style={{ color: theme.textSecondary, marginTop: 16 }}>No tasks found in this category.</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            <BottomNavigation
                activeScreen={ScreenName.HOME}
                onNavigate={onNavigate}
                onOpenNeuralInput={onOpenNeuralInput}
                onOpenContributorHub={onOpenContributorHub}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: { flex: 1 },
    flex1: { flex: 1 },
    scrollContent: { padding: SPACING.md, paddingBottom: 120 },
    homeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg
    },
    statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
    networkCard: {
        height: 180,
        borderRadius: LAYOUT.radius.xl,
        marginBottom: SPACING.lg,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    leaderboardBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: LAYOUT.radius.sm,
        marginBottom: SPACING.md
    },
    leaderboardAvatars: {
        position: 'absolute',
        top: SPACING.lg,
        right: SPACING.lg,
        zIndex: 2
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center' },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: { color: '#fff', fontSize: TYPOGRAPHY.size.sm, fontWeight: '700' },
    avatarTextSmall: { color: '#fff', fontSize: TYPOGRAPHY.size.xs, fontWeight: '700' },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.xs
    },
    featuredPromoCardSmall: {
        width: 300, 
        height: 130,
        borderRadius: LAYOUT.radius.xl,
        overflow: 'hidden',
        position: 'relative',
    },
    featuredPromoContent: {
        padding: SPACING.lg,
        paddingRight: 16,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'flex-start', // left align 
        height: '100%',
    },
    featuredPromoIconContainer: {
        position: 'absolute',
        right: SPACING.md,
        top: '50%',
        transform: [{ translateY: -40 }],
        zIndex: 1,
    },
    featuredPromoIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    campaignCard: {
        width: 240,
        borderRadius: LAYOUT.radius.xl,
        overflow: 'hidden',
        padding: SPACING.md,
        position: 'relative',
        minHeight: 180,
        justifyContent: 'flex-end',
    },
    campaignBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    campaignBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    campaignIconCircle: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    campaignTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        lineHeight: 20,
        marginTop: 36,
    },
    campaignReward: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
    },
    campaignDaysLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
    },
    campaignDaysLeftText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 10,
        fontWeight: '700',
    },
    campaignProgressTrack: {
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
    },
    campaignProgressFill: {
        height: 3,
        borderRadius: 2,
        backgroundColor: '#fff',
    },
    campaignStartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        paddingVertical: 8,
    },
    campaignStartBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    missionCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: LAYOUT.radius.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        alignItems: 'center'
    },
    missionIconBox: {
        width: 44,
        height: 44,
        borderRadius: LAYOUT.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md
    },
    missionInfo: { flex: 1 },
    missionMeta: { flexDirection: 'row', marginTop: 2 },
});
