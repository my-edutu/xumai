import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    StatusBar,
    SafeAreaView,
    FlatList,
    Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { countries } from '../utils/countries';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { UserService } from '../services/userService';
import { useUser } from '@clerk/clerk-expo';

interface LanguageSelectionProps {
    onNavigate: (screen: ScreenName) => void;
    isOnboarding?: boolean; // New prop to control flow
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionProps> = ({ onNavigate, isOnboarding = false }) => {
    const { theme } = useTheme();
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [expandedCountry, setExpandedCountry] = useState<string | null>('Nigeria');
    const [isSaving, setIsSaving] = useState(false);

    // Filter countries based on search
    const filteredCountries = useMemo(() => {
        if (!searchQuery) return countries;
        const lowerQuery = searchQuery.toLowerCase();
        return countries.filter(c =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.languages.some(l => l.toLowerCase().includes(lowerQuery))
        );
    }, [searchQuery]);

    // Toggle language selection
    const toggleLanguage = (language: string) => {
        if (selectedLanguages.includes(language)) {
            setSelectedLanguages(prev => prev.filter(l => l !== language));
        } else {
            setSelectedLanguages(prev => [...prev, language]);
        }
    };

    // Toggle country expansion
    const toggleCountry = (countryName: string) => {
        setExpandedCountry(prev => prev === countryName ? null : countryName);
    };

    const handleContinue = async () => {
        if (!user) {
            console.warn('[LanguageSelection] No user found, navigating directly.');
            onNavigate(isOnboarding ? ScreenName.TASK_INTERESTS : ScreenName.AUTH);
            return;
        }

        setIsSaving(true);
        try {
            const success = await UserService.updateLanguages(user.id, selectedLanguages);
            // If onboarding, continue to Interests. If settings mode, go back to Settings.
            if (isOnboarding) {
                onNavigate(ScreenName.TASK_INTERESTS);
            } else {
                onNavigate(ScreenName.SETTINGS);
            }
        } catch (error) {
            console.error('[LanguageSelection] Exception:', error);
            // Fallback navigation
            if (isOnboarding) {
                onNavigate(ScreenName.TASK_INTERESTS);
            } else {
                onNavigate(ScreenName.SETTINGS);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const renderCountryItem = ({ item, index }: { item: any; index: number }) => {
        const isExpanded = expandedCountry === item.name;

        // Remove heavy animations for smoother initial load, keep only simple fade
        // or optimized reanimated entrance if item count is small. 
        // For long lists, standard FlatList without heavy per-item animations is faster.
        return (
            <View style={[styles.countryCard, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                    style={styles.countryHeader}
                    onPress={() => toggleCountry(item.name)}
                >
                    <View style={styles.countryInfo}>
                        <Text style={styles.flag}>{item.flag}</Text>
                        <View>
                            <Text style={[styles.countryName, { color: theme.text }]}>{item.name}</Text>
                            <Text style={[styles.languageCount, { color: theme.textSecondary }]}>
                                {item.languages.length} Language{item.languages.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>
                    <MaterialIcons
                        name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                        size={24}
                        color={theme.textSecondary}
                    />
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.languagesContainer}>
                        <View style={styles.divider} />
                        <View style={styles.languagesGrid}>
                            {item.languages.map((lang: string) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={[
                                        styles.languageChip,
                                        {
                                            borderColor: selectedLanguages.includes(lang) ? theme.primary : theme.border,
                                            backgroundColor: selectedLanguages.includes(lang) ? `${theme.primary}20` : 'transparent'
                                        }
                                    ]}
                                    onPress={() => toggleLanguage(lang)}
                                >
                                    <Text style={[
                                        styles.languageText,
                                        { color: selectedLanguages.includes(lang) ? theme.primary : theme.textSecondary } // Use textSecondary instead of low opacity for better visibility
                                    ]}>
                                        {lang}
                                    </Text>
                                    {selectedLanguages.includes(lang) && (
                                        <MaterialIcons name="check" size={16} color={theme.primary} style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Background Elements */}
            <View style={styles.backgroundBlob1} />
            <View style={styles.backgroundBlob2} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            // If onboarding, maybe go back to Auth or Account Type?
                            // If settings, go back to Settings
                            if (isOnboarding) {
                                // Prevent going back to Auth if already signed in, maybe just stay or go home?
                                // Usually onboarding has no back button or goes back to step 1
                                onNavigate(ScreenName.AUTH);
                            } else {
                                onNavigate(ScreenName.SETTINGS);
                            }
                        }}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>Your Languages</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Select languages you are fluent in
                        </Text>
                    </View>
                </View>

                {/* Quick Select: English */}
                <View style={styles.quickSelectContainer}>
                    <TouchableOpacity
                        style={[
                            styles.quickSelectButton,
                            selectedLanguages.includes('English') && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                        onPress={() => toggleLanguage('English')}
                    >
                        <MaterialIcons
                            name={selectedLanguages.includes('English') ? "check-circle" : "add-circle-outline"}
                            size={24}
                            color={selectedLanguages.includes('English') ? "#fff" : theme.textSecondary}
                        />
                        <Text style={[
                            styles.quickSelectText,
                            { color: selectedLanguages.includes('English') ? "#fff" : theme.text }
                        ]}>
                            English (Global)
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                    <MaterialIcons name="search" size={24} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search countries or languages..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Optimized List */}
                <FlatList
                    data={filteredCountries}
                    keyExtractor={(item) => item.code}
                    renderItem={renderCountryItem}
                    contentContainerStyle={styles.scrollContent}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: 100 }} />}
                />

                {/* Bottom Action Bar */}
                <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                    <View style={styles.selectionCount}>
                        <Text style={{ color: theme.textSecondary }}>Selected:</Text>
                        <Text style={{ color: theme.primary, fontWeight: '700', marginLeft: 4 }}>
                            {selectedLanguages.length}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            { backgroundColor: selectedLanguages.length > 0 ? theme.primary : theme.textTertiary }
                        ]}
                        disabled={selectedLanguages.length === 0 || isSaving}
                        onPress={handleContinue}
                    >
                        <Text style={styles.continueText}>{isSaving ? 'Saving...' : isOnboarding ? 'Continue' : 'Save'}</Text>
                        {!isSaving && <MaterialIcons name="arrow-forward" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    backgroundBlob1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#6366f1', // Indigo
        opacity: 0.1,
        transform: [{ scale: 1.5 }],
    },
    backgroundBlob2: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#ec4899', // Pink
        opacity: 0.1,
        transform: [{ scale: 1.2 }],
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 24 : 12,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    quickSelectContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    quickSelectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    quickSelectText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    countryCard: {
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
    },
    countryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    countryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flag: {
        fontSize: 32,
        marginRight: 16,
    },
    countryName: {
        fontSize: 18,
        fontWeight: '700',
    },
    languageCount: {
        fontSize: 12,
        marginTop: 2,
    },
    languagesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    languagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    languageChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    languageText: {
        fontSize: 14,
        fontWeight: '500',
    },
    bottomBar: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
    },
    selectionCount: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    continueText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
});
