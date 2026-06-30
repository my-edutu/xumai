/**
 * Badge Component
 * 
 * Small status indicator or label chip
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, LAYOUT, TEXT_STYLES, OPACITY } from '../../constants/designTokens';
import { rgba } from '../../utils/styleUtils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
    /** Badge text */
    children: string;
    /** Badge variant */
    variant?: BadgeVariant;
    /** Badge size */
    size?: BadgeSize;
    /** Optional icon */
    icon?: keyof typeof MaterialIcons.glyphMap;
    /** Custom style */
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    icon,
    style,
}) => {
    const { theme } = useTheme();

    // Size configurations
    const sizeConfig = {
        sm: {
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            fontSize: TEXT_STYLES.caption.fontSize,
            iconSize: 12,
        },
        md: {
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            fontSize: TEXT_STYLES.labelSmall.fontSize,
            iconSize: 14,
        },
        lg: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm,
            fontSize: TEXT_STYLES.label.fontSize,
            iconSize: 16,
        },
    };

    const config = sizeConfig[size];

    // Variant colors
    const getVariantColors = () => {
        switch (variant) {
            case 'success':
                return {
                    backgroundColor: rgba(theme.success, OPACITY.subtle),
                    borderColor: rgba(theme.success, OPACITY.light),
                    textColor: theme.success,
                };
            case 'warning':
                return {
                    backgroundColor: rgba(theme.warning, OPACITY.subtle),
                    borderColor: rgba(theme.warning, OPACITY.light),
                    textColor: theme.warning,
                };
            case 'error':
                return {
                    backgroundColor: rgba(theme.error, OPACITY.subtle),
                    borderColor: rgba(theme.error, OPACITY.light),
                    textColor: theme.error,
                };
            case 'info':
                return {
                    backgroundColor: rgba(theme.info, OPACITY.subtle),
                    borderColor: rgba(theme.info, OPACITY.light),
                    textColor: theme.info,
                };
            case 'default':
            default:
                return {
                    backgroundColor: theme.surfaceHighlight,
                    borderColor: theme.border,
                    textColor: theme.textSecondary,
                };
        }
    };

    const colors = getVariantColors();

    return (
        <View
            style={[
                styles.container,
                {
                    paddingHorizontal: config.paddingHorizontal,
                    paddingVertical: config.paddingVertical,
                    backgroundColor: colors.backgroundColor,
                    borderColor: colors.borderColor,
                },
                style,
            ]}
        >
            {icon && (
                <MaterialIcons
                    name={icon}
                    size={config.iconSize}
                    color={colors.textColor}
                    style={styles.icon}
                />
            )}
            <Text
                style={[
                    TEXT_STYLES.captionBold,
                    {
                        fontSize: config.fontSize,
                        color: colors.textColor,
                    },
                ]}
            >
                {children}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: LAYOUT.radius.pill,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    icon: {
        marginRight: SPACING.xs,
    },
});
