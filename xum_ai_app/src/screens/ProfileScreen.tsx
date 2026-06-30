import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import * as TaskService from '../services/taskService';
import { GrowthPhaseCard } from '../components/GrowthPhaseCard';

interface ProfileScreenProps {
    onNavigate: (screen: any) => void;
    onBack?: () => void;
    session: any;
}

const { width } = Dimensions.get('window');

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate, onBack, session }) => {
    const { theme } = useTheme();

    const [badges, setBadges] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAllBadges, setShowAllBadges] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            Promise.all([
                TaskService.getUserTaskStats(session.user.id),
                TaskService.getUserBadges(session.user.id)
            ]).then(([statsData, badgesData]) => {
                setStats(statsData);
                setBadges(badgesData);
                setLoading(false);
            });
        }
    }, [session?.user?.id]);

    const formatMemberSince = (isoDate?: string | null): string => {
        if (!isoDate) return 'Recently';
        const d = new Date(isoDate);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const getContributorLevel = (totalEarned: number): { label: string; color: string } => {
        if (totalEarned >= 500) return { label: 'Elite', color: '#f59e0b' };
        if (totalEarned >= 200) return { label: 'Platinum', color: '#8b5cf6' };
        if (totalEarned >= 100) return { label: 'Gold', color: '#f59e0b' };
        if (totalEarned >= 50)  return { label: 'Silver', color: '#94a3b8' };
        return { label: 'Bronze', color: '#b45309' };
    };

    const totalEarnings = stats?.totalEarned || 0;
    const level = getContributorLevel(totalEarnings);

    const profileStats = {
        totalEarnings,
        tasksCompleted: stats?.approved || 0,
        dataContributed: stats ?
            `${((stats.voiceCount * 1 + stats.videoCount * 5 + stats.imageCount * 2) * 0.5).toFixed(1)} MB` : '0 MB',
        precision: stats?.totalSubmissions > 0 ? ((stats.approved / stats.totalSubmissions) * 100).toFixed(1) : '100.0',
        memberSince: formatMemberSince(session?.user?.created_at),
    };

    // Calculate max value for progress bars to scale them
    const maxCount = Math.max(
        (stats?.voiceCount || 0),
        (stats?.imageCount || 0),
        (stats?.videoCount || 0),
        10 // Minimum scale
    );

    const contributionData = [
        {
            label: 'Voice',
            count: stats?.voiceCount || 0,
            icon: 'mic',
            color: '#8b5cf6',
            progress: (stats?.voiceCount || 0) / maxCount
        },
        {
            label: 'Images',
            count: stats?.imageCount || 0,
            icon: 'photo-camera',
            color: '#3b82f6',
            progress: (stats?.imageCount || 0) / maxCount
        },
        {
            label: 'Videos',
            count: stats?.videoCount || 0,
            icon: 'videocam',
            color: '#ec4899',
            progress: (stats?.videoCount || 0) / maxCount
        },
    ];

    const menuItems = [
        { label: 'Edit Profile', icon: 'edit', screen: ScreenName.EDIT_PROFILE },
        { label: 'My Records', icon: 'history', screen: ScreenName.RECORDS },
        { label: 'Wallet', icon: 'account-balance-wallet', screen: ScreenName.WALLET },
        { label: 'Settings', icon: 'settings', screen: ScreenName.SETTINGS },
        { label: 'Help Centre', icon: 'help-outline', screen: 'SUPPORT' as any },
    ];

    // Profile Image Source Logic
    const profileImageSource = session?.user?.avatar_url
        ? { uri: session.user.avatar_url }
        : session?.user?.user_metadata?.avatar_url
            ? { uri: session.user.user_metadata.avatar_url }
            : { uri: 'https://i.pravatar.cc/150?u=' + (session?.user?.id || 'default') };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.HOME)} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>MY PROFILE</Text>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.SETTINGS)}>
                    <MaterialIcons name="more-vert" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <LinearGradient
                    colors={[theme.primary, theme.primaryDark]}
                    style={styles.profileCard}
                >
                    <View style={styles.profileInfo}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatarGlow, { backgroundColor: theme.primaryLight }]} />
                            <View style={styles.avatarBorder}>
                                <Image
                                    source={profileImageSource}
                                    style={styles.avatar}
                                />
                            </View>
                        </View>

                        <View style={styles.userInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                <Text style={styles.userName} numberOfLines={1}>
                                    {session?.user?.full_name || session?.user?.fullName || session?.user?.firstName || 'User'}
                                </Text>
                                <View style={{ marginLeft: 8, backgroundColor: level.color + '30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                    <Text style={{ color: level.color, fontSize: 10, fontWeight: '800' }}>{level.label.toUpperCase()}</Text>
                                </View>
                            </View>
                            <Text style={styles.userEmail}>{session?.user?.email || session?.user?.primaryEmailAddress?.emailAddress}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>
                                Member since {profileStats.memberSince}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.statValueText, { color: theme.success }]}>${Number(profileStats.totalEarnings).toFixed(2)}</Text>
                        <Text style={[styles.statLabelText, { color: theme.textSecondary }]}>Total Earned</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.statValueText, { color: theme.primary }]}>{profileStats.precision}%</Text>
                        <Text style={[styles.statLabelText, { color: theme.textSecondary }]}>Accuracy</Text>
                    </View>
                </View>

                {/* Growth / Monetization Phase */}
                {session?.user?.id && (
                    <GrowthPhaseCard userId={session.user.id} />
                )}

                {/* Badges Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>EARNED BADGES</Text>
                    <TouchableOpacity onPress={() => setShowAllBadges(!showAllBadges)}>
                        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                            {showAllBadges ? 'SHOW LESS' : 'VIEW ALL'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal={!showAllBadges}
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 32 }}
                    contentContainerStyle={showAllBadges ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : {}}
                >
                    {badges.length > 0 ? badges.map((badge, idx) => (
                        <View key={idx} style={[styles.badgeCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: showAllBadges ? 12 : 0 }]}>
                            <View style={[styles.badgeIcon, { backgroundColor: `${badge.color}20` }]}>
                                <MaterialIcons name={badge.icon as any} size={24} color={badge.color} />
                            </View>
                            <Text style={[styles.badgeTitle, { color: theme.text }]}>{badge.title}</Text>
                            <Text style={[styles.badgeDesc, { color: theme.textSecondary }]}>{badge.desc}</Text>
                        </View>
                    )) : (
                        <Text style={{ color: theme.textSecondary, fontStyle: 'italic', padding: 8 }}>
                            Complete tasks to earn badges!
                        </Text>
                    )}
                </ScrollView>

                {/* My Contributions - Premium Redesign */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>MY CONTRIBUTIONS</Text>
                    <TouchableOpacity onPress={() => onNavigate(ScreenName.RECORDS)}>
                        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>VIEW LOGS</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.contributionsGrid}>
                    {contributionData.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.contributionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                                <MaterialIcons name={item.icon as any} size={22} color={item.color} />
                            </View>
                            <View style={styles.contributionInfo}>
                                <View style={styles.contributionHeader}>
                                    <Text style={[styles.contributionLabel, { color: theme.text }]}>{item.label}</Text>
                                    <Text style={[styles.contributionCount, { color: item.color }]}>{item.count}</Text>
                                </View>
                                <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                                    <View style={[styles.progressBarFill, { width: `${Math.max(5, item.progress * 100)}%`, backgroundColor: item.color }]} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Menu Items */}
                <View style={[styles.menuContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                            onPress={() => onNavigate(item.screen)}
                        >
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconBox, { backgroundColor: `${theme.primary}10` }]}>
                                    <MaterialIcons name={item.icon as any} size={20} color={theme.primary} />
                                </View>
                                <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.footerText}>XUM Node Connection: ACTIVE</Text>
            </ScrollView>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'android' ? 24 : 12, // Matched with HomeScreen padding
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    profileCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    profileInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatarGlow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        top: -5,
        left: -5,
        opacity: 0.3,
    },
    avatarBorder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#fff',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    levelText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    userEmail: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginTop: 2,
    },
    xpBarContainer: {
        marginTop: 12,
    },
    xpBarBackground: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    xpText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
        marginTop: 4,
        opacity: 0.8,
    },
    rankBadge: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    rankLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
    },
    rankValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    statValueText: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabelText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    contributionsGrid: {
        gap: 12,
        marginBottom: 32,
    },
    contributionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contributionInfo: {
        flex: 1,
    },
    contributionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    contributionLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    contributionCount: {
        fontSize: 14,
        fontWeight: '800',
    },
    progressBarBg: {
        height: 4,
        borderRadius: 2,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    menuContainer: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 32,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    footerText: {
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 2,
        marginBottom: 20,
    },
    badgeCard: {
        width: 100,
        padding: 12,
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    badgeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    badgeTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
        textAlign: 'center',
    },
    badgeDesc: {
        fontSize: 9,
        textAlign: 'center',
        opacity: 0.8,
    },
});
