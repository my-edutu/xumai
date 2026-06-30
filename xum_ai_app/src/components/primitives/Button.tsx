/**
 * Button Component
 * 
 * Reusable button with multiple variants, sizes, and states
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { TEXT_STYLES, SPACING, LAYOUT, SHADOWS } from '../../constants/designTokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
    /** Button text */
    children: string;
    /** Button variant style */
    variant?: ButtonVariant;
    /** Button size */
    size?: ButtonSize;
    /** On press handler */
    onPress?: () => void;
    /** Disabled state */
    disabled?: boolean;
    /** Loading state - shows spinner */
    loading?: boolean;
    /** Icon to show on the left */
    leftIcon?: keyof typeof MaterialIcons.glyphMap;
    /** Icon to show on the right */
    rightIcon?: keyof typeof MaterialIcons.glyphMap;
    /** Full width button */
    fullWidth?: boolean;
    /** Custom style */
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    onPress,
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    style,
}) => {
    const { theme } = useTheme();

    // Size configurations
    const sizeConfig = {
        sm: {
            height: 40,
            paddingHorizontal: SPACING.md,
            fontSize: TEXT_STYLES.button.fontSize,
            iconSize: 16,
        },
        md: {
            height: LAYOUT.buttonHeight,
            paddingHorizontal: SPACING.lg,
            fontSize: TEXT_STYLES.button.fontSize,
            iconSize: 20,
        },
        lg: {
            height: 64,
            paddingHorizontal: SPACING.xl,
            fontSize: TEXT_STYLES.buttonLarge.fontSize,
            iconSize: 24,
        },
    };

    const config = sizeConfig[size];

    // Variant styles
    const getVariantStyles = () => {
        const isDisabled = disabled || loading;

        switch (variant) {
            case 'primary':
                return {
                    container: {
                        backgroundColor: isDisabled ? theme.textTertiary : theme.primary,
                        borderWidth: 0,
                    },
                    text: {
                        color: theme.textInverse,
                    },
                };
            case 'secondary':
                return {
                    container: {
                        backgroundColor: isDisabled ? theme.surfaceHighlight : theme.surface,
                        borderWidth: 1,
                        borderColor: theme.border,
                    },
                    text: {
                        color: isDisabled ? theme.textTertiary : theme.text,
                    },
                };
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderColor: isDisabled ? theme.border : theme.primary,
                    },
                    text: {
                        color: isDisabled ? theme.textTertiary : theme.primary,
                    },
                };
            case 'ghost':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                    },
                    text: {
                        color: isDisabled ? theme.textTertiary : theme.primary,
                    },
                };
            case 'danger':
                return {
                    container: {
                        backgroundColor: isDisabled ? theme.textTertiary : theme.error,
                        borderWidth: 0,
                    },
                    text: {
                        color: theme.textInverse,
                    },
                };
        }
    };

    const variantStyles = getVariantStyles();

    const containerStyle = [
        styles.base,
        {
            height: config.height,
            paddingHorizontal: config.paddingHorizontal,
            width: fullWidth ? '100%' : undefined,
        },
        variantStyles.container,
        variant === 'primary' && !disabled && !loading && SHADOWS.md,
        style, // Apply custom style last
    ];

    const textStyle = [
        TEXT_STYLES.button,
        {
            fontSize: config.fontSize,
        },
        variantStyles.text,
    ];

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variantStyles.text.color}
                />
            ) : (
                <View style={styles.content}>
                    {leftIcon && (
                        <MaterialIcons
                            name={leftIcon}
                            size={config.iconSize}
                            color={variantStyles.text.color}
                            style={styles.leftIcon}
                        />
                    )}
                    <Text style={textStyle}>{children}</Text>
                    {rightIcon && (
                        <MaterialIcons
                            name={rightIcon}
                            size={config.iconSize}
                            color={variantStyles.text.color}
                            style={styles.rightIcon}
                        />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: LAYOUT.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftIcon: {
        marginRight: SPACING.sm,
    },
    rightIcon: {
        marginLeft: SPACING.sm,
    },
});
