import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, RefreshControl, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import * as TaskService from '../services/taskService';
import { getFeaturedTasks, getDailyMissions, getFeedTasks } from '../services/marketplaceService';
import { getTaskTypeFromIcon, normalizeScreen } from '../navigation/taskRouting';

const appStyles: any = {}; // Temporary fix


interface TaskMarketplaceProps {
    onNavigate: (s: ScreenName, params?: any) => void;
    onOpenContributorHub: () => void;
    onOpenNeuralInput: () => void;
    session: any;
    onBack?: () => void;
}

export const TaskMarketplaceScreen = ({ onNavigate, onOpenContributorHub, onOpenNeuralInput, session, onBack }: TaskMarketplaceProps) => {
    const { theme } = useTheme();
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [featuredTasks, setFeaturedTasks] = useState<any[]>([]);
    const [missions, setMissions] = useState<any[]>([]);
    const [feedTasks, setFeedTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const filters = ['ALL', 'AUDIO', 'TEXT', 'IMAGE', 'VIDEO', 'VALIDATION'];

    const getFeedCategory = (filter: string): string => {
        if (filter === 'ALL') return 'All';
        if (filter === 'AUDIO') return 'Voice';
        return filter.charAt(0) + filter.slice(1).toLowerCase();
    };

    const loadTasks = async (showRefreshState = false) => {
        if (!session?.user?.id) return;
        if (showRefreshState) setRefreshing(true);
        else setIsLoading(true);

        try {
            const [f, m, feed] = await Promise.all([
                getFeaturedTasks(),
                getDailyMissions(session.user.id),
                getFeedTasks(getFeedCategory(activeFilter)),
            ]);
            setFeaturedTasks(f.filter((task: any) => task.title !== 'Verify AI Translations'));
            setMissions(m);
            setFeedTasks(feed);
        } catch (err) {
            console.warn('[TaskMarketplace] Failed to load tasks:', err);
            setFeaturedTasks([]);
            setMissions([]);
            setFeedTasks([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [session?.user?.id, activeFilter]);

    const onRefresh = React.useCallback(async () => {
        await loadTasks(true);
    }, [session?.user?.id, activeFilter]);

    const visibleFeedTasks = feedTasks.filter((task) => {
        const haystack = `${task.title || ''} ${task.subtitle || ''}`.toLowerCase();
        return haystack.includes(searchQuery.trim().toLowerCase());
    });

    const visibleMissions = missions.filter((mission) => {
        if (activeFilter === 'ALL') return true;
        const taskType = mission.task_type || getTaskTypeFromIcon(mission.icon_name);
        return normalizeScreen(mission.target_screen, taskType) === normalizeScreen(undefined, getFeedCategory(activeFilter));
    });

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>TASK</Text>
                <TouchableOpacity onPress={onRefresh} accessibilityRole="button" accessibilityLabel="Refresh tasks">
                    <MaterialIcons name="refresh" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.flex1}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* Search Bar with Filter Icon */}
                <View style={[taskStyles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialIcons name="search" size={20} color={theme.textSecondary} />
                    <TextInput
                        style={[taskStyles.searchInput, { color: theme.text }]}
                        placeholder="Search"
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity onPress={() => setIsFilterVisible(true)} style={{ padding: 4 }}>
                        <MaterialIcons name="tune" size={20} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                {/* Filter Modal */}
                <Modal visible={isFilterVisible} transparent animationType="fade" onRequestClose={() => setIsFilterVisible(false)}>
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}
                        activeOpacity={1}
                        onPress={() => setIsFilterVisible(false)}
                    >
                        <View style={{ backgroundColor: theme.surface, padding: 24, borderRadius: 24, width: '80%', gap: 12 }}>
                            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>FILTER BY TYPE</Text>
                            {filters.map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    style={[
                                        taskStyles.filterPill,
                                        { width: '100%', marginBottom: 12, backgroundColor: activeFilter === filter ? theme.primary : 'rgba(255,255,255,0.05)' }
                                    ]}
                                    onPress={() => { setActiveFilter(filter); setIsFilterVisible(false); }}
                                >
                                    <Text style={[taskStyles.filterText, { color: activeFilter === filter ? '#fff' : theme.textSecondary }]}>
                                        {filter}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                <TouchableOpacity
                    style={taskStyles.labCard}
                    onPress={() => onNavigate(ScreenName.LINGUASENSE_ENGINE)}
                    activeOpacity={0.9}
                >
                    <LinearGradient colors={[theme.surface, theme.background]} style={[taskStyles.labGradient, { borderColor: theme.border, borderWidth: 1, borderRadius: 24 }]}>
                        <View style={[taskStyles.labBadge, { backgroundColor: `${theme.primary}20` }]}>
                            <Text style={[taskStyles.labBadgeText, { color: theme.primary }]}>XUM LINGUASENCE</Text>
                        </View>
                        <Text style={[taskStyles.labTitle, { color: theme.text }]}>TRAIN YOUR{'\n'}OWN AI</Text>
                        <Text style={[taskStyles.labSubtitle, { color: theme.textSecondary, marginBottom: 0 }]}>Personalize models with your data and preferences.</Text>
                        <View style={taskStyles.labIcon}>
                            <MaterialIcons name="psychology" size={120} color={`${theme.primary}25`} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Featured Tasks */}
                <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 24, color: theme.text }]}>FEATURED TASKS</Text>
                {isLoading && featuredTasks.length === 0 ? (
                    <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[taskStyles.featuredRow, { paddingLeft: 16, paddingRight: 32 }]}
                    >
                        {featuredTasks.map((task) => {
                            const handlePress = () => {
                                const taskType = getTaskTypeFromIcon(task.icon_name);
                                const targetScreen = normalizeScreen(task.target_screen, taskType);
                                onNavigate(targetScreen);
                            };

                            return (
                                <TouchableOpacity key={task.id} onPress={handlePress} style={{ marginRight: 16 }}>
                                    <LinearGradient colors={[task.gradient_start || theme.primary, task.gradient_end || theme.primaryDark]} style={taskStyles.featuredCard}>
                                        {/* Content Container - Centered */}
                                        <View style={taskStyles.featuredContent}>
                                            <Text style={taskStyles.featuredTitle} numberOfLines={2}>{task.title}</Text>
                                            <Text style={taskStyles.featuredSubtitle} numberOfLines={2}>{task.subtitle}</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}

                {/* Active task feed */}
                <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 24, marginBottom: 16, color: theme.text }]}>ACTIVE TASKS</Text>
                <View style={{ paddingHorizontal: 16 }}>
                    {isLoading && feedTasks.length === 0 ? (
                        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
                    ) : visibleFeedTasks.length > 0 ? (
                        visibleFeedTasks.map((task) => (
                            <TouchableOpacity
                                key={`${task.isCampaign ? 'campaign' : 'task'}-${task.id}`}
                                onPress={() => onNavigate(normalizeScreen(task.screen, task.type), task.campaignId ? { campaignId: task.campaignId } : undefined)}
                                style={[styles.missionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                accessibilityRole="button"
                                accessibilityLabel={`Open ${task.title}`}
                            >
                                <View style={[styles.missionIconBox, { backgroundColor: `${task.color || theme.primary}20` }]}>
                                    <MaterialIcons name={(task.icon || 'assignment') as any} size={18} color={task.color || theme.primary} />
                                </View>
                                <View style={styles.missionInfo}>
                                    <Text style={[styles.missionTitle, { color: theme.text }]}>{task.title}</Text>
                                    <Text style={[styles.missionTime, { color: theme.textSecondary }]} numberOfLines={1}>{task.subtitle}</Text>
                                </View>
                                <Text style={[styles.missionReward, { color: theme.success }]}>${Number(task.reward || 0).toFixed(2)}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No active tasks available.</Text>
                    )}
                </View>

                {/* Available Missions */}
                <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 24, marginBottom: 16, color: theme.text }]}>
                    AVAILABLE MISSIONS
                </Text>
                <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
                    {isLoading && missions.length === 0 ? (
                        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
                    ) : visibleMissions.length > 0 ? (
                        visibleMissions.map((mission) => (
                            <TouchableOpacity key={mission.id} onPress={() => onNavigate(normalizeScreen(mission.target_screen, mission.task_type || getTaskTypeFromIcon(mission.icon_name)))} style={[styles.missionCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: mission.is_locked_for_new_users ? 0.6 : 1 }]} disabled={mission.is_locked_for_new_users}>
                                <View style={[styles.missionIconBox, { backgroundColor: `${mission.icon_color || theme.primary}20` }]}>
                                    <MaterialIcons name={(mission.icon_name || 'assignment') as any} size={18} color={mission.icon_color || theme.primary} />
                                </View>
                                <View style={styles.missionInfo}>
                                    <Text style={[styles.missionTitle, { color: theme.text }]}>{mission.title}</Text>
                                    <Text style={[styles.missionTime, { color: theme.textSecondary }]}>⏱ {mission.estimated_time || '2M'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.missionReward, { color: theme.success }]}>${(mission.reward || 0).toFixed(2)}</Text>
                                    {mission.is_locked_for_new_users && <MaterialIcons name="lock" size={14} color={theme.textSecondary} />}
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No missions available.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

// Styles
const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row' as 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 24 : 12, // Matched with HomeScreen padding
        paddingBottom: 20,
        borderBottomWidth: 1,
        justifyContent: 'space-between' as 'space-between',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900' as '900',
        letterSpacing: 1,
    },
    flex1: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900' as '900',
        letterSpacing: 1,
        marginBottom: 12,
    },
    missionCard: {
        flexDirection: 'row' as 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    missionIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    missionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    missionTitle: {
        fontSize: 14,
        fontWeight: '600' as '600',
        marginBottom: 4,
    },
    missionMeta: {
        flexDirection: 'row' as 'row',
        alignItems: 'center',
    },
    missionTime: {
        fontSize: 12,
    },
    missionReward: {
        fontSize: 14,
        fontWeight: '900' as '900',
    },
});

const taskStyles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row' as 'row',
        alignItems: 'center',
        margin: 16,
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
    },
    filterPill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginRight: 8,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '700' as '700',
        letterSpacing: 0.5,
    },
    labCard: {
        marginHorizontal: 16,
        marginBottom: 8,
    },
    labGradient: {
        padding: 24,
        borderRadius: 24,
        position: 'relative' as 'relative',
        overflow: 'hidden' as 'hidden',
    },
    labBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    labBadgeText: {
        fontSize: 10,
        fontWeight: '900' as '900',
        letterSpacing: 1,
    },
    labTitle: {
        fontSize: 24,
        fontWeight: '800' as '800',
        marginBottom: 8,
        lineHeight: 28,
    },
    labSubtitle: {
        fontSize: 14,
        maxWidth: '70%',
        marginBottom: 20,
        lineHeight: 20,
    },
    labButton: {
        flexDirection: 'row' as 'row',
        alignItems: 'center',
        gap: 8,
    },
    labButtonText: {
        fontSize: 13,
        fontWeight: '900' as '900',
        letterSpacing: 0.5,
    },
    labIcon: {
        position: 'absolute' as 'absolute',
        right: -20,
        bottom: -20,
        transform: [{ rotate: '-15deg' }],
    },
    featuredRow: {
        paddingRight: 16,
    },
    featuredCard: {
        width: 300,
        height: 130,
        borderRadius: 20,
        overflow: 'hidden' as 'hidden',
        position: 'relative' as 'relative',
        marginRight: 12,
    },
    featuredContent: {
        padding: 20,
        paddingRight: 16,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'flex-start', // Left align
        height: '100%',
    },
    featuredTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600' as '600',
        marginBottom: 6,
        letterSpacing: 0.3,
        lineHeight: 22,
        textAlign: 'left', // Left text alignment
    },
    featuredSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: '500' as '500',
        lineHeight: 16,
        textAlign: 'left', // Left text alignment
    },
    featuredIconContainer: {
        position: 'absolute' as 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -40 }],
        zIndex: 1,
    },
    featuredIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
    },
});
