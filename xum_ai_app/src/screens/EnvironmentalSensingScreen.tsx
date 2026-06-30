import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';

interface EnvironmentalSensingScreenProps {
    onNavigate: (s: ScreenName) => void;
}

export const EnvironmentalSensingScreen = ({ onNavigate }: EnvironmentalSensingScreenProps) => {
    const { theme } = useTheme();
    const [showStreakBanner, setShowStreakBanner] = useState(true);

    const captureOptions = [
        {
            title: 'Record Voice',
            subtitle: 'Speak prompts to help AI understand speech',
            icon: 'mic',
            color: '#1349ec',
            reward: '$0.25 per task',
            screen: ScreenName.VOICE_TASK
        },
        {
            title: 'Take Photos',
            subtitle: 'Capture images of objects and scenes',
            icon: 'camera-alt',
            color: '#10b981',
            reward: '$0.30 per task',
            screen: ScreenName.IMAGE_TASK
        },
        {
            title: 'Record Video',
            subtitle: 'Film short clips for motion training',
            icon: 'videocam',
            color: '#f43f5e',
            reward: '$0.50 per task',
            screen: ScreenName.VIDEO_TASK
        },
    ];

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>CAPTURE DATA</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Dismissible Streak Notification Banner */}
            {showStreakBanner && (
                <View style={[styles.streakBanner, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }]}>
                    <MaterialIcons name="local-fire-department" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                    <Text style={[styles.streakBannerText, { color: theme.text }]}>
                        Complete <Text style={{ fontWeight: '700', color: theme.primary }}>5 tasks in a row</Text> to unlock your reward bonus!
                    </Text>
                    <TouchableOpacity onPress={() => setShowStreakBanner(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialIcons name="close" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Capture Options */}
                {captureOptions.map((opt, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[styles.optionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => onNavigate(opt.screen)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.optionIconBox, { backgroundColor: opt.color }]}>
                            <MaterialIcons name={opt.icon as any} size={28} color="#fff" />
                        </View>
                        <View style={styles.optionInfo}>
                            <Text style={[styles.optionTitle, { color: theme.text }]}>{opt.title}</Text>
                            <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>{opt.subtitle}</Text>
                            <Text style={[styles.optionReward, { color: theme.success }]}>{opt.reward}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = {
    screenContainer: { flex: 1 },
    flex1: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        padding: 20,
        paddingTop: Platform.OS === 'android' ? 24 : 12,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 1 },
    streakBanner: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    streakBannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
    optionCard: { flexDirection: 'row' as const, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, alignItems: 'center' as const },
    optionIconBox: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 16 },
    optionInfo: { flex: 1 },
    optionTitle: { fontSize: 17, fontWeight: '700' as const, marginBottom: 4 },
    optionSubtitle: { fontSize: 14, marginBottom: 8 },
    optionReward: { fontSize: 14, fontWeight: '600' as const },
};
