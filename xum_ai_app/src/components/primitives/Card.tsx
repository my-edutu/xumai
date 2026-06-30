/**
 * Card Component
 * 
 * Flexible card container with optional header and footer
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, LAYOUT, SHADOWS, TEXT_STYLES } from '../../constants/designTokens';
import { glassEffect } from '../../utils/styleUtils';

export interface CardProps {
    /** Card content */
    children: React.ReactNode;
    /** Optional header title */
    title?: string;
    /** Optional header subtitle */
    subtitle?: string;
    /** Optional footer content */
    footer?: React.ReactNode;
    /** Make card pressable */
    onPress?: () => void;
    /** Use glass morphism effect */
    glass?: boolean;
    /** Custom padding (overrides default) */
    padding?: number;
    /** Custom style */
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    title,
    subtitle,
    footer,
    onPress,
    glass = false,
    padding = SPACING.lg,
    style,
}) => {
    const { theme } = useTheme();

    const cardStyle = [
        styles.container,
        {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            padding,
        },
        glass && glassEffect(theme.primary, 0.05),
        SHADOWS.sm,
        style,
    ];

    const content = (
        <>
            {(title || subtitle) && (
                <View style={styles.header}>
                    {title && <Text style={[TEXT_STYLES.h4, { color: theme.text }]}>{title}</Text>}
                    {subtitle && (
                        <Text style={[TEXT_STYLES.bodySmall, { color: theme.textSecondary, marginTop: SPACING.xs }]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            )}
            <View style={styles.body}>{children}</View>
            {footer && <View style={styles.footer}>{footer}</View>}
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyle}>{content}</View>;
};

const styles = StyleSheet.create({
    container: {
        borderRadius: LAYOUT.radius.lg,
        borderWidth: 1,
    },
    header: {
        marginBottom: SPACING.md,
    },
    body: {
        // Content goes here
    },
    footer: {
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
    },
});
