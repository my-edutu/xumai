import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, TYPOGRAPHY, LAYOUT } from '../constants/designTokens';

interface EmptyStateCardProps {
    title?: string;
    description?: string;
    icon?: keyof typeof MaterialIcons.glyphMap;
}

export const EmptyStateCard = ({ 
    title = 'NO TASKS YET', 
    description = 'Check back later for new opportunities', 
    icon = 'assignment' 
}: EmptyStateCardProps) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}10` }]}>
                <MaterialIcons name={icon} size={32} color={theme.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderRadius: LAYOUT.radius.lg,
        borderWidth: 1,
        marginBottom: SPACING.md,
        borderStyle: 'dashed',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: TYPOGRAPHY.size.sm,
        lineHeight: 18,
    },
});
