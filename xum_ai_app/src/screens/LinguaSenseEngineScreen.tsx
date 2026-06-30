import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { TYPOGRAPHY, SPACING, LAYOUT, TEXT_STYLES } from '../constants/designTokens';
import { Header } from '../components/Shared';

interface LinguaSenseProps {
    onNavigate: (screen: ScreenName) => void;
}

export const LinguaSenseEngineScreen = ({ onNavigate }: LinguaSenseProps) => {
    const { theme } = useTheme();
    const [showInfo, setShowInfo] = useState(true);

    const options = [
        {
            id: 'text',
            title: 'Semantic Text',
            description: 'Provide written names, meanings, and context for grounded items.',
            icon: 'edit',
            colors: ['#3b82f6', '#2563eb'],
            screen: ScreenName.LINGUASENSE
        },
        {
            id: 'voice',
            title: 'Neural Voice',
            description: 'Record natural spoken pronunciations and tonal descriptions.',
            icon: 'mic',
            colors: ['#ec4899', '#db2777'],
            screen: ScreenName.VOICE_TASK
        },
        {
            id: 'both',
            title: 'Full Multimodal',
            description: 'Maximum reward: Build the ultimate grounded dataset with text and voice.',
            icon: 'record-voice-over',
            colors: ['#8b5cf6', '#7c3aed'],
            screen: ScreenName.LINGUASENSE
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header
                title="Linguasense Engine"
                onBack={() => onNavigate(ScreenName.HOME)}
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroSection}>
                    <Text style={[TEXT_STYLES.h3, { color: theme.text, marginBottom: SPACING.sm }]}>
                        Semantic <Text style={{ color: theme.primary }}>Grounding</Text>
                    </Text>
                    <Text style={[TEXT_STYLES.body, { color: theme.textSecondary, lineHeight: 22 }]}>
                        Help build the "Gold Standard" of grounded language data. Your contributions train the next generation of spatial AI.
                    </Text>
                </View>

                <View style={styles.optionsGrid}>
                    <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>CHOOSE DATA MODALITY</Text>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            activeOpacity={0.8}
                            onPress={() => onNavigate(option.screen)}
                            style={[styles.optionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        >
                            <LinearGradient
                                colors={option.colors}
                                style={styles.iconContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name={option.icon as any} size={28} color="#fff" />
                            </LinearGradient>
                            <View style={styles.textContainer}>
                                <Text style={[TEXT_STYLES.h6, { color: theme.text, marginBottom: 2 }]}>{option.title}</Text>
                                <Text style={[TEXT_STYLES.caption, { color: theme.textSecondary, lineHeight: 16 }]}>
                                    {option.description}
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={theme.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Card */}
                {showInfo && (
                    <LinearGradient
                        colors={[`${theme.success}10`, `${theme.success}05`]}
                        style={[styles.infoCard, { borderColor: `${theme.success}30` }]}
                    >
                        <View style={[styles.infoIcon, { backgroundColor: theme.success }]}>
                            <MaterialIcons name="verified" size={20} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[TEXT_STYLES.label, { color: theme.text, marginBottom: 2 }]}>Verified Integrity</Text>
                            <Text style={[TEXT_STYLES.caption, { color: theme.textSecondary }]}>
                                Contributions are cross-verified. High-quality data earns <Text style={{ color: theme.success, fontWeight: '700' }}>Bonus Trust Score</Text>.
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowInfo(false)} style={styles.infoClose}>
                            <MaterialIcons name="close" size={16} color={theme.textTertiary} />
                        </TouchableOpacity>
                    </LinearGradient>
                )}

                <View style={styles.footerInfo}>
                    <MaterialIcons name="security" size={16} color={theme.textTertiary} />
                    <Text style={[TEXT_STYLES.caption, { color: theme.textTertiary, marginLeft: 8 }]}>
                        End-to-end encrypted neural submission
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    heroSection: {
        marginBottom: SPACING.xl,
        marginTop: SPACING.md,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: SPACING.md,
        paddingLeft: 4,
    },
    optionsGrid: {
        gap: SPACING.md,
    },
    optionCard: {
        borderRadius: LAYOUT.radius.xl,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    textContainer: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    infoCard: {
        marginTop: SPACING.xxl,
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: LAYOUT.radius.lg,
        borderWidth: 1,
        alignItems: 'center',
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    infoClose: {
        padding: 4,
        marginLeft: SPACING.sm,
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xxl,
        opacity: 0.6,
    }
});
