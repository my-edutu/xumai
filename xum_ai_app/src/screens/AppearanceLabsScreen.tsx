import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, ThemeId } from '../context/ThemeContext';
import { ScreenName } from '../types';

interface AppearanceLabsScreenProps {
    onNavigate: (s: ScreenName) => void;
    currentTheme: ThemeId;
    onThemeChange: (themeId: ThemeId) => void;
}

export const AppearanceLabsScreen = ({ onNavigate, currentTheme, onThemeChange }: AppearanceLabsScreenProps) => {
    const { theme } = useTheme();
    const screenWidth = Dimensions.get('window').width;
    const padding = 20;
    const gap = 12;
    const columnCount = screenWidth > 600 ? 4 : 3;
    const cardWidth = (screenWidth - (padding * 2) - (gap * (columnCount - 1))) / columnCount;

    const isDarkMode = currentTheme !== 'light';

    const themes: { id: ThemeId; name: string; color: string }[] = [
        { id: 'midnight', name: 'Midnight', color: '#1349ec' },
        { id: 'emerald', name: 'Emerald', color: '#10b981' },
        { id: 'solar', name: 'Solar', color: '#f59e0b' },
        { id: 'amoled', name: 'AMOLED', color: '#818cf8' },
        { id: 'night', name: 'Night', color: '#8b5cf6' },
        { id: 'crimson', name: 'Crimson', color: '#f43f5e' },
    ];

    const handleThemeSelect = (themeId: ThemeId) => {
        onThemeChange(themeId);
    };

    const handleDarkModeToggle = () => {
        if (isDarkMode) {
            onThemeChange('light');
        } else {
            onThemeChange('midnight');
        }
    };

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>APPEARANCE</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
                {/* Dark Mode Toggle Card */}
                <TouchableOpacity
                    style={[styles.modeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={handleDarkModeToggle}
                    activeOpacity={0.7}
                >
                    <View style={styles.modeInfo}>
                        <View style={[styles.modeIconBox, { backgroundColor: `${theme.primary}20` }]}>
                            <MaterialIcons name={isDarkMode ? "dark-mode" : "light-mode"} size={22} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.modeTitle, { color: theme.text }]}>Dark Mode</Text>
                            <Text style={[styles.modeSubtitle, { color: theme.textSecondary }]}>
                                {isDarkMode ? 'On' : 'Off'} • Tap to toggle
                            </Text>
                        </View>
                    </View>
                    <View style={styles.toggleContainer}>
                        <View style={[styles.toggleTrack, { backgroundColor: isDarkMode ? theme.primary : 'rgba(255,255,255,0.2)' }]}>
                            <View style={[styles.toggleThumb, { marginLeft: isDarkMode ? 20 : 2 }]} />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Section Title */}
                <Text style={[styles.sectionTitle, { marginBottom: 20, marginTop: 24, color: theme.text }]}>CHOOSE THEME</Text>

                {/* Theme Grid */}
                {isDarkMode ? (
                    <View style={styles.grid}>
                        {themes.map((t) => {
                            const isActive = currentTheme === t.id;
                            return (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[
                                        styles.themeCard,
                                        {
                                            width: cardWidth,
                                            backgroundColor: theme.surface,
                                            borderColor: isActive ? t.color : 'transparent',
                                        },
                                        isActive && { backgroundColor: `${t.color}08` }
                                    ]}
                                    onPress={() => handleThemeSelect(t.id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.themeColor, { backgroundColor: t.color }]} />
                                    <Text style={[styles.themeName, { color: theme.text }]}>{t.name}</Text>
                                    <View style={[
                                        styles.themeBadge,
                                        isActive && { backgroundColor: t.color }
                                    ]}>
                                        <Text style={[
                                            styles.themeBadgeText,
                                            isActive && styles.themeBadgeTextActive
                                        ]}>
                                            {isActive ? 'ACTIVE' : 'SELECT'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialIcons name="light-mode" size={24} color={theme.primary} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ color: theme.text, fontWeight: '600' }}>Light Mode Active</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                                Enable Dark Mode to access theme options
                            </Text>
                        </View>
                    </View>
                )}
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
    modeCard: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 20, borderRadius: 16, borderWidth: 1 },
    modeInfo: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
    modeIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center' as const, alignItems: 'center' as const },
    modeTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 2 },
    modeSubtitle: { fontSize: 13 },
    toggleContainer: {},
    toggleTrack: { width: 48, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' as const },
    toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
    sectionTitle: { fontSize: 13, fontWeight: '800' as const, letterSpacing: 1.2 },
    grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 12 },
    themeCard: { padding: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center' as const, gap: 8 },
    themeColor: { width: 48, height: 48, borderRadius: 24 },
    themeName: { fontSize: 13, fontWeight: '600' as const },
    themeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
    themeBadgeText: { fontSize: 9, fontWeight: '800' as const, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
    themeBadgeTextActive: { color: '#fff' },
    infoBox: { flexDirection: 'row' as const, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' as const },
};
