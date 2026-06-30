import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    ImageBackground,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
    getLeaderboard,
    getWeeklyLeaderboard,
    getCountryLeaderboard,
    getUserGlobalRank,
} from '../services/walletService';
import { ScreenName } from '../types';
import { LeaderboardEntry } from '../services/types';
import * as TaskService from '../services/taskService';
import { createGlobalStyles, createCaptureStyles } from '../styles';
import { rgba } from '../utils/styleUtils';
import { TEXT_STYLES } from '../constants/designTokens';
import { supabase } from '../supabaseClient';

type LeaderboardTab = 'global' | 'country' | 'weekly';

interface LeaderboardScreenProps {
    onNavigate: (s: ScreenName) => void;
    onBack?: () => void;
    session: any;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onNavigate, onBack, session }) => {
    const { theme } = useTheme();
    const styles = createGlobalStyles(theme);
    const captureStyles = createCaptureStyles(theme);

    const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
    const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([]);
    const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([]);
    const [countryData, setCountryData] = useState<LeaderboardEntry[]>([]);
    const [userCountry, setUserCountry] = useState('');
    const [userTotalEarned, setUserTotalEarned] = useState(0);
    const [userGlobalRank, setUserGlobalRank] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [session?.user?.id]);

    const loadData = async () => {
        if (!session?.user?.id) return;
        setIsLoading(true);
        try {
            // Fetch user's country for the country tab
            let country = '';
            if (supabase) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('location')
                    .eq('id', session.user.id)
                    .maybeSingle();
                country = userData?.location || '';
                setUserCountry(country);
            }

            const [global, weekly, stats, rank] = await Promise.all([
                getLeaderboard(15),
                getWeeklyLeaderboard(15),
                TaskService.getUserTaskStats(session.user.id),
                getUserGlobalRank(session.user.id),
            ]);

            setGlobalData(global);
            setWeeklyData(weekly);
            setUserTotalEarned(stats?.totalEarned || 0);
            setUserGlobalRank(rank);

            if (country) {
                const cData = await getCountryLeaderboard(country, 15);
                setCountryData(cData);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isRankUnlocked = userTotalEarned >= 10;

    const handleRankPress = () => {
        if (!isRankUnlocked) {
            Alert.alert(
                'Rank Locked',
                'You need to earn at least $10.00 to unlock your global ranking.',
                [{ text: 'OK' }]
            );
        }
    };

    const tabs: { key: LeaderboardTab; label: string }[] = [
        { key: 'global', label: 'Global' },
        { key: 'country', label: userCountry || 'Country' },
        { key: 'weekly', label: 'Weekly' },
    ];

    const activeData =
        activeTab === 'global' ? globalData :
        activeTab === 'weekly' ? weeklyData :
        countryData;

    const sectionLabel =
        activeTab === 'global' ? 'TOP EARNERS' :
        activeTab === 'weekly' ? 'THIS WEEK' :
        `TOP IN ${(userCountry || 'COUNTRY').toUpperCase()}`;

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: Platform.OS === 'android' ? 24 : 12, paddingBottom: 16 }]}>
                <TouchableOpacity onPress={() => onBack ? onBack() : onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>LEADERBOARD</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Hero rank card */}
                <TouchableOpacity activeOpacity={0.95} style={{ marginBottom: 24 }} onPress={handleRankPress}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop' }}
                        style={{ height: 160, borderRadius: 24, overflow: 'hidden', justifyContent: 'center' }}
                        imageStyle={{ opacity: 0.4 }}
                    >
                        <LinearGradient
                            colors={['transparent', rgba(theme.background, 0.9)]}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={{ padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <MaterialIcons name="emoji-events" size={16} color="#ffd700" />
                                </View>
                                <Text style={[TEXT_STYLES.h4, { color: '#fff', fontSize: 24, lineHeight: 32 }]}>
                                    Global{'\n'}Leaderboard
                                </Text>
                            </View>

                            {isRankUnlocked ? (
                                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase', fontWeight: '700' }}>
                                        Your Rank
                                    </Text>
                                    <Text style={{ color: '#fff', fontSize: 48, fontWeight: '800', lineHeight: 56 }}>
                                        #{userGlobalRank ?? '-'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ alignItems: 'flex-start', justifyContent: 'center', opacity: 0.8 }}>
                                    <MaterialIcons name="lock" size={28} color="rgba(255,255,255,0.6)" style={{ marginBottom: 8 }} />
                                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 15, textAlign: 'left' }}>
                                        Unlock{'\n'}at $10
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ImageBackground>
                </TouchableOpacity>

                {/* Tab selector */}
                <View style={{ flexDirection: 'row', marginBottom: 20, gap: 8 }}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                paddingVertical: 10,
                                borderRadius: 12,
                                alignItems: 'center',
                                backgroundColor: activeTab === tab.key ? theme.primary : theme.surface,
                                borderWidth: 1,
                                borderColor: activeTab === tab.key ? theme.primary : theme.border,
                            }}
                        >
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: activeTab === tab.key ? '#fff' : theme.textSecondary,
                                letterSpacing: 0.5,
                            }}>
                                {tab.label.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>
                    {sectionLabel}
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                ) : activeData.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 40 }}>
                        <MaterialIcons name="leaderboard" size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
                        <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '600' }}>No data yet</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
                            {activeTab === 'country' && !userCountry
                                ? 'Update your location in your profile to see country rankings.'
                                : 'Be the first to earn and appear here!'}
                        </Text>
                    </View>
                ) : (
                    activeData.map((entry, idx) => (
                        <View
                            key={entry.user_id}
                            style={[captureStyles.optionCard, {
                                backgroundColor: entry.user_id === session?.user?.id
                                    ? `${theme.primary}15`
                                    : theme.surface,
                                borderColor: entry.user_id === session?.user?.id
                                    ? theme.primary
                                    : theme.border,
                                marginBottom: 12,
                            }]}
                        >
                            <View style={{
                                width: 36, height: 36, borderRadius: 18,
                                backgroundColor: idx < 3 ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                                justifyContent: 'center', alignItems: 'center', marginRight: 12,
                            }}>
                                <Text style={{ color: idx < 3 ? '#fff' : theme.textSecondary, fontWeight: '700', fontSize: 14 }}>
                                    {entry.rank}
                                </Text>
                            </View>
                            <View style={{
                                width: 44, height: 44, borderRadius: 22,
                                backgroundColor: `${theme.primary}20`,
                                justifyContent: 'center', alignItems: 'center', marginRight: 12,
                            }}>
                                <Text style={{ color: theme.primary, fontSize: 18, fontWeight: '700' }}>
                                    {entry.full_name?.[0] || '?'}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
                                        {entry.user_id === session?.user?.id ? 'You' : entry.full_name}
                                    </Text>
                                    {idx < 3 && (
                                        <MaterialIcons name="verified" size={14} color="#3b82f6" style={{ marginLeft: 4 }} />
                                    )}
                                </View>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                    {entry.tasks_completed} tasks{entry.country ? ` • ${entry.country}` : ''}
                                </Text>
                            </View>
                            <Text style={{ color: theme.success, fontSize: 16, fontWeight: '700' }}>
                                ${Number(entry.total_earned).toFixed(2)}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};
