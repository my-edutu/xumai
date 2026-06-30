/**
 * Input Component
 * 
 * Styled TextInput with label, error state, and icon support
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, LAYOUT, TEXT_STYLES, TYPOGRAPHY } from '../../constants/designTokens';

export interface InputProps extends TextInputProps {
    /** Input label */
    label?: string;
    /** Error message to display */
    error?: string;
    /** Left icon */
    leftIcon?: keyof typeof MaterialIcons.glyphMap;
    /** Right icon */
    rightIcon?: keyof typeof MaterialIcons.glyphMap;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    style,
    ...textInputProps
}) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[TEXT_STYLES.label, { color: theme.text, marginBottom: SPACING.sm }]}>
                    {label}
                </Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: error ? theme.error : theme.border,
                    },
                ]}
            >
                {leftIcon && (
                    <MaterialIcons
                        name={leftIcon}
                        size={20}
                        color={theme.textSecondary}
                        style={styles.leftIcon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        TEXT_STYLES.body,
                        {
                            color: theme.text,
                            fontFamily: TYPOGRAPHY.fonts.body,
                        },
                        style,
                    ]}
                    placeholderTextColor={theme.textTertiary}
                    {...textInputProps}
                />
                {rightIcon && (
                    <MaterialIcons
                        name={rightIcon}
                        size={20}
                        color={theme.textSecondary}
                        style={styles.rightIcon}
                    />
                )}
            </View>
            {error && (
                <Text style={[TEXT_STYLES.caption, { color: theme.error, marginTop: SPACING.xs }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: LAYOUT.radius.md,
        borderWidth: 1,
        height: LAYOUT.inputHeight,
        paddingHorizontal: SPACING.md,
    },
    input: {
        flex: 1,
        height: '100%',
    },
    leftIcon: {
        marginRight: SPACING.sm,
    },
    rightIcon: {
        marginLeft: SPACING.sm,
    },
});
