
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { MonetizationThresholdService, MonetizationStatus } from '../services/monetizationThresholdService';
import { SPACING, LAYOUT, TYPOGRAPHY, SHADOWS, PALETTE } from '../constants/designTokens';
import { LinearGradient } from 'expo-linear-gradient';

interface GrowthPhaseCardProps {
    userId: string;
    onApply?: () => void;
}

export const GrowthPhaseCard: React.FC<GrowthPhaseCardProps> = ({ userId, onApply }) => {
    const { theme } = useTheme();
    const [status, setStatus] = useState<MonetizationStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatus();
    }, [userId]);

    const loadStatus = async () => {
        setLoading(true);
        const data = await MonetizationThresholdService.getMonetizationStatus(userId);
        setStatus(data);
        setLoading(false);
    };

    const handleApply = () => {
        if (onApply) {
            onApply();
        } else {
            Alert.alert('Application Submitted', 'Your request for monetization has been received.');
        }
    };

    if (loading) {
        return (
            <View style={[styles.card, { backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', height: 160 }]}>
                <ActivityIndicator color={theme.primary} />
            </View>
        );
    }

    if (!status) return null;

    const isEligible = status.isEligible;
    const progressPercent = Math.min(100, Math.max(0, status.percentage));

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: isEligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)' }]}>
                    <MaterialIcons
                        name={isEligible ? "monetization-on" : "trending-up"}
                        size={24}
                        color={isEligible ? PALETTE.emerald.primary : PALETTE.orange.primary}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {isEligible ? 'Monetization Unlocked' : 'Growth Phase'}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {isEligible ? 'Start earning from your content' : 'Reach audience target to earn'}
                    </Text>
                </View>
                {isEligible && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>ELIGIBLE</Text>
                    </View>
                )}
            </View>

            {/* Progress Section */}
            <View style={styles.progressContainer}>
                <View style={styles.progressLabels}>
                    <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                        Followers
                    </Text>
                    <Text style={[styles.progressValue, { color: theme.text }]}>
                        {status.currentFollowers} <Text style={{ color: theme.textSecondary, fontWeight: '400' }}>/ {status.targetFollowers}</Text>
                    </Text>
                </View>

                <View style={styles.progressBarBackground}>
                    <LinearGradient
                        colors={isEligible ? [PALETTE.emerald.light, PALETTE.emerald.primary] : [PALETTE.orange.warning, PALETTE.orange.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                    />
                </View>

                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    {status.description}
                </Text>
            </View>

            {/* Action */}
            {isEligible && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleApply}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Enable Monetization</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: LAYOUT.radius.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        marginBottom: SPACING.md,
        ...SHADOWS.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: LAYOUT.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    title: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.size.xs,
    },
    badge: {
        backgroundColor: PALETTE.emerald.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    progressContainer: {
        marginBottom: SPACING.md,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '600',
    },
    progressValue: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '700',
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    description: {
        fontSize: TYPOGRAPHY.size.xs,
        lineHeight: 18,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: LAYOUT.radius.md,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '700',
    }
});
